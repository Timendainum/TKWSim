"use strict";

const async = require("async");
const _ = require("lodash");

module.exports = class Area {
	static init(config) {
		this.config = config;
	}

	/**
	 * area heartbeat
	 * @param callback(err)
	 */
	static heartbeat(callback) {
		log.info("area heartbeat");
		async.series([
			Area.activateForcedActive,
			Area.activateAdjacentAreas,
			Area.deactivateStaleAreas
		], (err) => {
			callback(err);
		});
	}

	/**
	 * cycles through all online PCs and activates adjacent areas
	 * @param callback
	 */
	static activateAdjacentAreas(callback) {
		log.info("Activating adjacent areas to online PCs.");
		async.each(Player.onlinePlayers, (player, cb) => {
			log.info(`Activating adjacent areas to ${player.player}.`);
			if (player.character === undefined || player.character.areaID === undefined) {
				log.warn(`Chararacter not found for ${player.player}`);
				return cb();
			}
			Area.getAdjacentAreaIDs(player.character.areaID, (err, areaIDs) => {
				if (err) {
					log.error(`Unable to get adjacent area areas for ${player.player}`, { err: err});
					return cb(err);
				}
				log.debug(`Activating areas adjacent to ${player.player}`, { areaIDs: areaIDs});
				async.each(areaIDs, (areaID, acb) => {
					Area.activate(areaID, (err) => {
						acb(err);
					});
				}, cb);
			});
		}, callback);
	}

	/**
	 * activates specified areaID
	 * @param callback(err)
	 */
	static activate(areaID, callback) {
		DB.connection.query({
			sql: `UPDATE tbl_area
					SET activate = 1
					WHERE area_id = ?`,
		}, [areaID], (err) => {
			if (err) {
				log.error("Error activating area", {areaID: areaID});
			} else {
				log.debug("Activated area", {areaID: areaID});
			}
			callback(err);
		});
	}

	/**
	 * activates all areas that are forced active
	 * @param callback(err)
	 */
	static activateForcedActive(callback) {
		DB.connection.query({
			sql: `UPDATE tbl_area
					SET activate = 1
					WHERE always_active = 1
					AND active <> 1
					AND activate <> 1;`,
		}, [], (err) => {
			if (err) {
				log.error("Error running activateForcedActive", {areaID: areaID});
			}
			callback(err);
		});
	}

	/**
	 * deactivates specified areaID
	 * @param callback(err)
	 */
	static deactivate(areaID, callback) {
		DB.connection.query({
			sql: `UPDATE tbl_area
					SET activate = 0
					WHERE area_id = ?`,
		}, [areaID], (err) => {
			if (err) {
				log.error("Error deactivating area", {areaID: areaID});
			} else {
				log.debug("Deactivated area", {areaID: areaID});
			}
			callback(err);
		});
	}

	/**
	 * deactivates areas that are stale and not adjacent to PCs
	 * @param callback
	 */
	static deactivateStaleAreas(callback) {
		log.info("Deactivating stale areas.");
		let pcAreas = Area.getAreasWithPCs();
		// exclude adjacent, and force active areas
		DB.connection.query({
			sql: `SELECT a.area_id
					FROM tbl_area a
					WHERE a.area_id NOT IN (?)
					AND a.always_active = 0
					AND a.area_id NOT IN (SELECT area_id FROM tbl_area_destination WHERE destination_area_id NOT IN (?))`,
		}, [pcAreas, pcAreas], (err, recordset) => {
			if (err) {
				return callback(err, undefined);
			}

			log.debug("Area.getAdjacentAreaIDs db result", {areaID: areaID, recordset: recordset});

			callback(err, _.map(recordset, "destination_area_id"));
		});

}

	/**
	 * calls back areaIDs adjacent to specified areaID
	 * @param areaID {int}
	 * @param callback
	 */
	static getAdjacentAreaIDs(areaID, callback) {
		DB.connection.query({
			sql: `SELECT destination_area_id
					FROM tbl_area_destination
					WHERE area_id = ?`,
		}, [areaID], (err, recordset) => {
			if (err) {
				return callback(err, undefined);
			}

			log.debug("Area.getAdjacentAreaIDs db result", {areaID: areaID, recordset: recordset});

			callback(err, _.map(recordset, "destination_area_id"));
		});
	}

	/**
	 * returns array of areaIDs with PCs in them
	 * @param callback(err, areaIDs {array})
	 */
	static getAreasWithPCs() {
		return _(Player.onlinePlayers)
			.filter(p => p.character !== undefined && p.character.areaID !== undefined)
			.map("character.areaID").value();
	}

	/**
	 * calls back true if area is adjacent to an online PC
	 * @param areaID
	 * @param callback(err, isAdjacent {bool}
	 */
	static getIsAdjacentToAreaWithPC(areaID, callback) {
		callback(undefined);
	}

	/**
	 *
	 * @param areaTag
	 * @param callback(err, id {int})
	 */
	static getIDByTag(areaTag, callback) {
		DB.connection.query({
			sql: `SELECT area_id
					FROM tbl_area
					WHERE tag = ?`,
		}, [areaTag], (err, recordset) => {
			if (err) {
				return callback(err, undefined);
			}

			log.debug("Area.getIDByTag db result", {areaTag: areaTag, recordset: recordset});

			callback(undefined, parseInt(recordset[0].area_id));
		});
	}

	/**
	 * set's last seen time to current date/time
	 * @param areaID
	 * @param callback
	 */
	static setLastSeen(areaID, callback) {
		DB.connection.query({
			sql: `UPDATE tbl_area
					SET pc_last_seen = ?
					WHERE area_id = ?`,
		}, [new Date(), areaID], (err) => {
			if (err) {
				log.error("Error setting last seen on area", {areaID: areaID, err: err});
			}
			callback(err);
		});
	}
};
