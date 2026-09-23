"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController = __importStar(require("../controllers/admin.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_1 = require("../middleware/validate");
const admin_validator_1 = require("../validators/admin.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, (0, auth_middleware_1.authorize)("admin"));
router.get("/analytics", adminController.getAnalytics);
router.get("/students", adminController.listStudents);
router.get("/tutors", adminController.listTutors);
router.patch("/students/:id/verification", (0, validate_1.validateBody)(admin_validator_1.verificationActionSchema), adminController.verifyStudent);
router.patch("/tutors/:id/verification", (0, validate_1.validateBody)(admin_validator_1.verificationActionSchema), adminController.verifyTutor);
router.patch("/tutors/:id/approve", adminController.verifyTutor);
router.get("/users/:id/contact", adminController.getUserContact);
router.patch("/users/:id/suspend", adminController.toggleSuspendUser);
router.delete("/users/:id", adminController.deleteUser);
router.get("/tuition-posts", adminController.listTuitionPosts);
router.get("/tuition-posts/:id", adminController.getTuitionPostDetail);
router.delete("/tuition-posts/:id", adminController.deleteTuitionPost);
// Admin mediation / connection state machine (spec section 9).
router.patch("/applications/:id/contact-start", adminController.startApplicationContact);
router.patch("/applications/:id/connect", adminController.markApplicationConnected);
router.patch("/applications/:id/connection-failed", adminController.markApplicationConnectionFailed);
router.patch("/applications/:id/cancel", adminController.cancelApplicationConnection);
router.get("/donations", adminController.listDonations);
router.patch("/donations/:id/salary-received", (0, validate_1.validateBody)(admin_validator_1.donationSalaryReceivedSchema), adminController.markDonationSalaryReceived);
router.patch("/donations/:id/verify", (0, validate_1.validateBody)(admin_validator_1.donationVerificationSchema), adminController.verifyDonationPayment);
router.patch("/donations/:id/overdue", adminController.markDonationOverdue);
router.patch("/donations/:id/remind", adminController.remindDonation);
router.patch("/donations/:id/suspend", adminController.suspendDonationTutor);
router.patch("/donations/:id/reinstate", adminController.reinstateTutor);
router.post("/notifications/broadcast", (0, validate_1.validateBody)(admin_validator_1.broadcastNotificationSchema), adminController.broadcastNotification);
// Audit trail (spec section 23) — admin-only, read-only.
router.get("/audit-logs", adminController.listAudit);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map