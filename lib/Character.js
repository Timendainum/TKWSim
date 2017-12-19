"use strict";

const async = require("async");
const _ = require("lodash");

module.exports = class Character {
	static init(config, log, DB) {
		this.config = config;
		this.log = log;
		this.DB = DB;
	}

	/**
	 * calls back character record object
	 * @param characterID
	 * @param callback(err, character {object})
	 */
	static get(characterID, callback) {
		Character.DB.connection.query({
			sql: `SELECT *
					FROM tbl_character
					WHERE character_id = ?`,
		}, [characterID], (err, recordset) => {
			if (err)
				callback(err, undefined);

			Character.log.debug("Character.get db result", {recordset: recordset});

			callback(undefined, recordset[0]);
		});
	}

	/**
	 *
	 * @param characterID
	 * @param callback(err, areaName {string})
	 */
	static getArea(characterID, callback) {
		Character.DB.connection.query({
			sql: `SELECT val
					FROM tbl_character_data
					WHERE \`key\` = ?
					AND name = ?`,
		}, [characterID, "TKW_PC_LOCATION"], (err, recordset) => {
			if (err)
				callback(err, undefined);

			Character.log.debug("Character.getArea db result", {recordset: recordset});

			callback(undefined, recordset[0].val.split("#")[2]);
		});
	}
};
