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
};
