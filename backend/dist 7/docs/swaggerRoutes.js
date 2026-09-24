"use strict";
/**
 * @swagger
 * /suggestions:
 *   post:
 *     tags:
 *       - Content Suggestions
 *     summary: Submit a city, event, or attraction suggestion
 *     description: Authenticated users submit content suggestions for admin approval.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - payload
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [attraction, event, city]
 *               payload:
 *                 type: object
 *                 description: Cities can omit gpsPosition. Attractions and events can use address + city instead of gpsPosition.
 *           examples:
 *             citySuggestion:
 *               summary: City suggestion
 *               value:
 *                 type: city
 *                 payload:
 *                   name: Skagen
 *                   tagLine: Hvor de to have mødes
 *                   description: Skagen er Danmarks nordligste by, kendt for sine unikke landskaber, kunsthistorie og maritime kultur. Byen tiltrækker hvert år mange besøgende med Grenen, de karakteristiske gule huse og den hyggelige havn.
 *                   heroImage: https://example.com/skagen.jpg
 *                   commune: Frederikshavn Kommune
 *                   region: Region Nordjylland
 *                   country: Danmark
 *                   population: 7900
 *                   visitorCenter: Skagen Turistinformation
 *             attractionSuggestion:
 *               summary: Attraction suggestion with address
 *               value:
 *                 type: attraction
 *                 payload:
 *                   name: Den Tilsandede Kirke
 *                   description: En historisk kirke nær Skagen, hvor kun tårnet stadig er synligt over sandet.
 *                   heroImage: https://example.com/tilsandede-kirke.jpg
 *                   price: 0
 *                   link: https://example.com/tilsandede-kirke
 *                   address: Gamle Landevej 63
 *                   city: Skagen
 *                   imageArray:
 *                     - https://example.com/tilsandede-kirke-2.jpg
 *                   slugArray:
 *                     - historie
 *                     - natur
 *                   openingHours:
 *                     - Altid åben
 *             eventSuggestion:
 *               summary: Event suggestion with address
 *               value:
 *                 type: event
 *                 payload:
 *                   name: Skagen Festival
 *                   description: Musikfestival med koncerter og arrangementer i hele byen.
 *                   heroImage: https://example.com/skagen-festival.jpg
 *                   price: 250
 *                   link: https://example.com/skagen-festival
 *                   address: Havnevej 2
 *                   city: Skagen
 *                   imageArray:
 *                     - https://example.com/skagen-festival-2.jpg
 *                   slugArray:
 *                     - musik
 *                     - festival
 *                   openingHours:
 *                     - Fredag 12:00-23:00
 *                   isAnnual: true
 *                   startDate: 2026-07-03T10:00:00.000Z
 *                   endDate: 2026-07-05T21:00:00.000Z
 *     responses:
 *       201:
 *         description: Suggestion submitted
 *       400:
 *         description: Invalid suggestion
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=swaggerRoutes.js.map