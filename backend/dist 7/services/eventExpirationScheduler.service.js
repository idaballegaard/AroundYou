"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveExpiredEvents = archiveExpiredEvents;
exports.startEventExpirationScheduler = startEventExpirationScheduler;
exports.stopEventExpirationScheduler = stopEventExpirationScheduler;
const event_service_1 = require("./event.service");
const CHECK_INTERVAL_MILLISECONDS = 15 * 60 * 1000;
let expirationTimer;
let isArchiving = false;
function archiveExpiredEvents() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isArchiving) {
            return;
        }
        isArchiving = true;
        try {
            const archivedCount = yield (0, event_service_1.archiveExpiredEventRecords)();
            if (archivedCount > 0) {
                console.log(`Archived ${archivedCount} expired event(s).`);
            }
        }
        catch (error) {
            // A failed cleanup must never stop the API or future cleanup attempts.
            console.error("Could not archive expired events:", error);
        }
        finally {
            isArchiving = false;
        }
    });
}
function startEventExpirationScheduler() {
    return __awaiter(this, void 0, void 0, function* () {
        if (expirationTimer) {
            return;
        }
        yield archiveExpiredEvents();
        expirationTimer = setInterval(() => {
            void archiveExpiredEvents();
        }, CHECK_INTERVAL_MILLISECONDS);
    });
}
function stopEventExpirationScheduler() {
    if (expirationTimer) {
        clearInterval(expirationTimer);
        expirationTimer = undefined;
    }
}
//# sourceMappingURL=eventExpirationScheduler.service.js.map