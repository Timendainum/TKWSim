"use strict";

const mysql = require("mysql");

module.exports = class DB {
	static init(config) {
		this.config = config;
		this.connection = mysql.createConnection(this.config.mysql);
	}

	static connect(callback) {
		DB.connection.connect(err => {
			if (err) {
				log.error("connect to mysql error", {err: err});
			} else {
				log.info("connected to mysql");
			}
			callback(err);
		});

	}

	static disconnect(callback) {
		DB.connnection.disconnect((err) => {
			if (err) {
				log.error("disconnect from mysql error", {err: err});
			} else {
				log.info("disconnected from mysql");
			}
			callback(err);
		});
	}
};
