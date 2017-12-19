"use strict";

const async = require("async");
const _ = require("lodash");

module.exports = class Player {
	static init(config, log, DB) {
		this.config = config;
		this.log = log;
		this.DB = DB;
		this.onlinePlayers = [];
	}

	static heartbeat(callback) {
		Player.log.info("player heartbeat");
		async.series([
			Player.updateOnlinePlayers,
			Player.updateOnlinePCLocations
		], (err) => {
			callback(err);
		});
	}

	/**
	 *
	 * @param callback(err)
	 */
	static updateOnlinePlayers(callback) {
		Player.DB.connection.query({
			sql: `SELECT *
					FROM tbl_player
					WHERE online = 1`,
		}, [], (err, recordset) => {
			if (err)
				callback(err);

			Player.log.debug("database result", {recordset: recordset});

			let onlineIDs = _.map(recordset, "player_id");
			let memoryIDs = _.map(Player.onlinePlayers, "player_id");
			let loggedOnIDs = _.difference(onlineIDs, memoryIDs);
			let loggedOffIDs = _.difference(memoryIDs, onlineIDs);

			Player.log.debug("pre processing", {onlineIDs: onlineIDs, memoryIDs: memoryIDs, loggedOnIDs: loggedOnIDs, loggedOffIDs: loggedOffIDs});


			_.forEach(loggedOnIDs, (playerID) => {
				let player = _.find(recordset, (r) => parseInt(r.player_id) === playerID);
				Character.get(player.online_as, function (err, result) {
					if (err) {
						Player.log.error("updateOnlinePlayers error retrieving character", { player_id: player.player_id, character_id: player.online_as, err: err});
						return;
					}
					player.character = result;
					Player.log.info(`${player.player} logged in as ${player.character.name}.`);
				});

				Player.onlinePlayers.push(player);
				Player.log.info(`Player ${player.player} logged on.`);
			});

			let index;
			_.forEach(loggedOffIDs, (playerID) => {
				let player = _.find(Player.onlinePlayers, (r) => parseInt(r.player_id) === playerID);
				index = _.findIndex(Player.onlinePlayers, (o) => o.player_id === playerID);
				if (index !== -1) {
					Player.onlinePlayers.splice(index, 1);
					Player.log.info(`Player ${player.player} logged off.`);
				}
			});

			Player.log.info(JSON.stringify(Player.onlinePlayers));
			callback(undefined);
		});
	}

	static updateOnlinePCLocations(callback) {
		Player.log.info("Updating PC locations");
		async.each(Player.onlinePlayers, (player, cb) => {
			if (!player.character) {
				return cb();
			}

			Character.getArea(player.character.character_id, (err, areaTag) => {
				if (err) {
					Player.log.error("Player.updateOnlinePCLocations error getting character area", {err: err});
					return cb(err);
				}
				Area.getIDByTag(areaTag, (err, areaID) => {
					if (err) {
						Player.log.error("Player.updateOnlinePCLocations error getting character areaID", {err: err});
						return cb(err);
					}
					player.character.areaTag = areaTag;
					player.character.areaID = areaID;
					Player.log.info(`${player.player}/${player.character.name} is in ${areaTag}/${areaID}`);
					cb();
				});
			});
		}, callback);
	}
};
