#!/usr/bin/env node
"use strict";

/* *********************************************************************************************************************
 * modules
 */
const _ = require("lodash");
const async = require("async");
const Winston = require("winston");
const log = new Winston.Logger({
	exitOnError: true,
	debugStdout: true,
	transports: [
		new Winston.transports.Console({
			colorize: true,
			timestamp: true,
			handleExceptions: true,
			humanReadableUnhandledException: true,
			level: "info"
		})
	]
});

const config = require("./config");

const DB = require("./lib/DB");
DB.init(config, log);

const Area = require("./lib/Area");
Area.init(config, log, DB);

const Player = require("./lib/Player");
Player.init(config, log, DB);

/* *********************************************************************************************************************
 * vars
 */

/* *********************************************************************************************************************
 * entry point
 */
start();

/* *********************************************************************************************************************
 * functions
 */
function start() {
	// lets get it done...
	log.info("Starting TKWSim...");
	async.series([
		DB.connect,
		startHeartbeat
	], (err) => {
		log.error("start() error", {err: err});
	});
}

/**
 * starts heartbeat running
 * @returns {Promise}
 */
function startHeartbeat() {
	async.forever(
		function (next) {
			log.debug("startHeartbeat() - forever iteration");
			heartbeat(() => {
				setTimeout(next, config.heartbeatDelay);
			});
		},
		function (err) {
			if (err) {
				log.error("startHeartbeat error", {err: err});
			}
		}
	);
}

/**
 * heartBeat is to call slow update functions, mainly intended to retrieve commands from AI
 * @param callback
 */
function heartbeat(callback) {
	log.warn("heartbeat");
	async.series([
		Area.heartbeat,
		Player.heartbeat
	], (err) => {
		if (err) {
			log.error("heartBeat() error", {err: err});
		}
		callback(err);
	});
}
