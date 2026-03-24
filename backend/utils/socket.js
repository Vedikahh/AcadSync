let io;

module.exports = {
    init: (httpServer, corsOptions = {}) => {
        io = require('socket.io')(httpServer, {
            cors: {
                ...corsOptions,
                methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
            }
        });

        io.on('connection', (socket) => {
            console.log('Client connected: ' + socket.id);

            socket.on('disconnect', () => {
                console.log('Client disconnected: ' + socket.id);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
