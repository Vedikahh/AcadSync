let io;
const jwt = require('jsonwebtoken');

const getTokenFromSocket = (socket) => {
    const authToken = socket.handshake?.auth?.token;
    if (authToken) return authToken;

    const authHeader = socket.handshake?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return null;
};

const getUserRoom = (userId) => `user:${String(userId)}`;

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

            const token = getTokenFromSocket(socket);
            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    if (decoded?.id) {
                        socket.join(getUserRoom(decoded.id));
                    }
                } catch (error) {
                    console.warn(`Socket auth failed for ${socket.id}: ${error.message}`);
                }
            }

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
    },
    emitToUser: (userId, event, payload) => {
        if (!io || !userId) return;
        io.to(getUserRoom(userId)).emit(event, payload);
    }
};
