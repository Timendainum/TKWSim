"use strict";

const async = require("async");
const _ = require("lodash");

module.exports = class Character {
	static init(config, log, DB) {
		this.config = config;
		this.log = log;
		this.DB = DB;
	}

	static getCharacter(characterID, callback) {
		Character.DB.connection.query({
			sql: `SELECT *
					FROM tbl_character
					WHERE character_id = ?`,
		}, [characterID], (err, recordset) => {
			if (err)
				callback(err, []);

			Character.log.debug("database result", {recordset: recordset});

			callback(undefined, recordset[0]);
		});
	}
};
