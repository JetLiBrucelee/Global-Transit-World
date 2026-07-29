import { Router, type IRouter } from "express";
import { sendContactEnquiryToSupport, sendContactConfirmation } from "../lib/email";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const { name, email, subject, message } = req.body ?? {};

  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "name, email, subject, and message are required" });
    return;
  }

  // Basic email format check
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  try {
    // Fire both in parallel — one to support, one to the sender
    await Promise.all([
      sendContactEnquiryToSupport({ name, email, subject, message }),
      sendContactConfirmation({ name, email, subject }),
    ]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[contact] email send failed:", err);
    res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

export default router;
