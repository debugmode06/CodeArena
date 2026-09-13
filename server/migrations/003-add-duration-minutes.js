const mongoose = require("mongoose");

module.exports = {
  version: 3,
  name: "Backfill durationMinutes on contests",
  up: async () => {
    const db = mongoose.connection.db;
    const contests = db.collection("contests");

    const cursor = contests.find({ durationMinutes: { $exists: false } });
    for await (const contest of cursor) {
      const start = new Date(contest.startTime).getTime();
      const end = new Date(contest.endTime).getTime();
      const minutes = Math.max(1, Math.round((end - start) / 60000) || 1);

      await contests.updateOne(
        { _id: contest._id },
        { $set: { durationMinutes: minutes } }
      );
    }
  }
};
