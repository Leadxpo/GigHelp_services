// utils/chatHelpers.js
// const express = require('express');
const { sequelize } = require("../db");
const TaskModel = require("../Models/Task")(sequelize);
const BidModel = require("../Models/Bids")(sequelize);

async function getTaskAndBidder(taskId, bidderId = null) {
  console.log("abcd");

  const task = await TaskModel.findOne({
    where: { taskId },
    attributes: ["taskId", "userId"],
  });

  console.log("task", task);

  if (!task) throw new Error("Task not found");

  let bidder = null;
  if (bidderId) {
    bidder = await BidModel.findOne({
      where: { taskId, userId: bidderId },
      attributes: ["userId"],
    });
    if (!bidder) throw new Error("Bidder not found for this task");
  }

  console.log(task, bidder, "3456");

  return {
    ownerId: task.userId,
    ownerType: "user",
    bidderId: bidder ? bidder.userId : null,
    bidderType: bidder ? "user" : null,
  };
}

module.exports = { getTaskAndBidder };

module.exports = { getTaskAndBidder };
