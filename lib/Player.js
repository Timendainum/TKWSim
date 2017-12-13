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
			Player.updateOnlinePlayers
		], (err) => {
			callback(err);
		});
	}

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
};
