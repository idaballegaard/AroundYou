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
exports.startOplevEsbjergImportScheduler = startOplevEsbjergImportScheduler;
exports.stopOplevEsbjergImportScheduler = stopOplevEsbjergImportScheduler;
const crawledEventCandidate_service_1 = require("./crawledEventCandidate.service");
const COPENHAGEN_TIME_ZONE = "Europe/Copenhagen";
const DEFAULT_IMPORT_HOUR = 6;
let scheduledImport;
let importInProgress = false;
function isDailyImportEnabled() {
    var _a;
    const value = (_a = process.env.CRAWLER_DAILY_IMPORT_ENABLED) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    return value !== "false" && value !== "0";
}
function getImportHour() {
    const configuredHour = Number(process.env.CRAWLER_DAILY_IMPORT_HOUR);
    return Number.isInteger(configuredHour) && configuredHour >= 0 && configuredHour <= 23
        ? configuredHour
        : DEFAULT_IMPORT_HOUR;
}
function getTimeZoneOffsetMilliseconds(date) {
    var _a;
    const offset = (_a = new Intl.DateTimeFormat("en-US", {
        timeZone: COPENHAGEN_TIME_ZONE,
        timeZoneName: "longOffset",
    })
        .formatToParts(date)
        .find((part) => part.type === "timeZoneName")) === null || _a === void 0 ? void 0 : _a.value;
    const match = offset === null || offset === void 0 ? void 0 : offset.match(/^GMT([+-])(\d{2}):(\d{2})$/);
    if (!match) {
        return 0;
    }
    const minutes = Number(match[2]) * 60 + Number(match[3]);
    return (match[1] === "+" ? 1 : -1) * minutes * 60 * 1000;
}
function getNextImportTime(now = new Date()) {
    const localParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: COPENHAGEN_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);
    const part = (type) => { var _a; return Number((_a = localParts.find((current) => current.type === type)) === null || _a === void 0 ? void 0 : _a.value); };
    const importHour = getImportHour();
    let localDateAtImportHour = new Date(Date.UTC(part("year"), part("month") - 1, part("day"), importHour));
    let nextImport = new Date(localDateAtImportHour.getTime() - getTimeZoneOffsetMilliseconds(localDateAtImportHour));
    if (nextImport <= now) {
        localDateAtImportHour = new Date(localDateAtImportHour.getTime() + 24 * 60 * 60 * 1000);
        nextImport = new Date(localDateAtImportHour.getTime() - getTimeZoneOffsetMilliseconds(localDateAtImportHour));
    }
    return nextImport;
}
function scheduleNextImport() {
    const nextImport = getNextImportTime();
    const delay = nextImport.getTime() - Date.now();
    scheduledImport = setTimeout(() => {
        void runScheduledImport();
    }, delay);
    console.log(`Next Oplev Esbjerg event import is scheduled for ${nextImport.toLocaleString("da-DK", {
        timeZone: COPENHAGEN_TIME_ZONE,
    })}.`);
}
function runScheduledImport() {
    return __awaiter(this, void 0, void 0, function* () {
        if (importInProgress) {
            scheduleNextImport();
            return;
        }
        importInProgress = true;
        try {
            const result = yield (0, crawledEventCandidate_service_1.importOplevEsbjergEventCandidates)();
            console.log(`Scheduled Oplev Esbjerg import completed: ${result.persistence.inserted} new and ${result.persistence.updated} updated candidates.`);
        }
        catch (error) {
            console.error("Scheduled Oplev Esbjerg import failed:", error);
        }
        finally {
            importInProgress = false;
            scheduleNextImport();
        }
    });
}
function startOplevEsbjergImportScheduler() {
    if (!isDailyImportEnabled()) {
        console.log("Daily Oplev Esbjerg event import is disabled.");
        return;
    }
    if (scheduledImport) {
        return;
    }
    scheduleNextImport();
}
function stopOplevEsbjergImportScheduler() {
    if (scheduledImport) {
        clearTimeout(scheduledImport);
        scheduledImport = undefined;
    }
}
//# sourceMappingURL=oplevEsbjergImportScheduler.service.js.map