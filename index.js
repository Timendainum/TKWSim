#!/usr/bin/env node
"use strict";

/* *********************************************************************************************************************
 * modules
 */
const _ = require("lodash");
const async = require("async");
const Winston = require("winston");

const config = require("./config");

global.log = new Winston.Logger({
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

global.DB = require("./lib/DB");
DB.init(config);

global.Area = require("./lib/Area");
Area.init(config);

global.Player = require("./lib/Player");
Player.init(config);

global.Character = require("./lib/Character");
Character.init(config);

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
 * heartBeat is to call slow update functions
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

/**
 * starts heartbeat running
 * @returns {Promise}
 */
function startTick5Min() {
	async.forever(
		function (next) {
			log.debug("startTick5Min() - forever iteration");
			tick5Min(() => {
				setTimeout(next, 300000);
			});
		},
		function (err) {
			if (err) {
				log.error("startTick5Min error", {err: err});
			}
		}
	);
}

/**
 * tick5Min is called every 5 minutes
 * @param callback
 */
function tick5Min(callback) {
	log.warn("tick5Min");
	async.series([
		Area.deactivateStaleAreas
	], (err) => {
		if (err) {
			log.error("tick5Min() error", {err: err});
		}
		callback(err);
	});
}
