"use strict";

const async = require("async");

module.exports = class Area {
	static init(config, log, DB) {
		this.config = config;
		this.log = log;
		this.DB = DB;
	}

	static heartbeat(callback) {
		Area.log.info("area heartbeat");
		async.series([
			Area.activateForcedActive
		], (err) => {
			callback(err);
		});
	}

	static activateForcedActive(callback) {
		Area.DB.connection.query({
			sql: `UPDATE tbl_area
					SET activate = 1
					WHERE always_active = 1
					AND active <> 1
					AND activate <> 1;`,
		}, [], (err) => {
			callback(err);
		});
	}

	/**
	 *
	 * @param areaTag
	 * @param callback(err, id {int})
	 */
	static getIDByTag(areaTag, callback) {
		Character.DB.connection.query({
			sql: `SELECT area_id
					FROM tbl_area
					WHERE tag = ?`,
		}, [areaTag], (err, recordset) => {
			if (err) {
				return callback(err, undefined);
			}

			Character.log.warn("Area.getIDByTag db result", {areaTag: areaTag, recordset: recordset});

			callback(undefined, parseInt(recordset[0].val));
		});
	}

};
