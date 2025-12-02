/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Anti-crash handler
 */

export const loadAntiCrash = () => {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[AntiCrash] Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
        console.error('[AntiCrash] Uncaught Exception:', error);
    });

    process.on('uncaughtExceptionMonitor', (error) => {
        console.error('[AntiCrash] Uncaught Exception Monitor:', error);
    });
};
