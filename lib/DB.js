"use strict";

const mysql = require("mysql");

module.exports = class DB {
	static init(config, log) {
		this.config = config;
		this.log = log;
		this.connection = mysql.createConnection(this.config.mysql);
	}

	static connect(callback) {
		DB.connection.connect(err => {
			if (err) {
				DB.log.error("connect to mysql error", {err: err});
			} else {
				DB.log.info("connected to mysql");
			}
			callback(err);
		});

	}

	static disconnect(callback) {
		DB.connnection.disconnect((err) => {
			if (err) {
				DB.log.error("disconnect from mysql error", {err: err});
			} else {
				DB.log.info("disconnected from mysql");
			}
			callback(err);
		});
	}
};
