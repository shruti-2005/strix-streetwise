let ioInstance = null;

function initSockets(io) {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    // Citizens join a room for their locality to get targeted alerts/notifications
    socket.on("join_locality", (locality) => {
      if (!locality) return;
      socket.join(`locality:${locality}`);
    });

    socket.on("leave_locality", (locality) => {
      if (!locality) return;
      socket.leave(`locality:${locality}`);
    });

    // Authority dashboards join a global "authority" room for all live updates
    socket.on("join_authority_room", () => {
      socket.join("authority_room");
    });

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });
}

// --- Emitters used by controllers ---

function emitNewIssue(issue) {
  if (!ioInstance) return;
  ioInstance.emit("issue:new", issue); // everyone sees new pins on the live map
  ioInstance.to("authority_room").emit("authority:new_issue", issue);
  if (issue.locality) {
    ioInstance.to(`locality:${issue.locality}`).emit("locality:new_issue", issue);
  }
}

function emitStatusUpdate(issue) {
  if (!ioInstance) return;
  ioInstance.emit("issue:status_update", issue);
  if (issue.locality) {
    ioInstance.to(`locality:${issue.locality}`).emit("locality:status_update", issue);
  }
}

function emitConstructionAlert(issue) {
  if (!ioInstance) return;
  ioInstance.emit("hazard:alert", issue);
  if (issue.locality) {
    ioInstance.to(`locality:${issue.locality}`).emit("locality:hazard_alert", issue);
  }
}

module.exports = { initSockets, emitNewIssue, emitStatusUpdate, emitConstructionAlert };
