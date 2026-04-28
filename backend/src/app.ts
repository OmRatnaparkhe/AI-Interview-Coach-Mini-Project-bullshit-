import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import mcqRoutes from "./modules/mcq/mcq.routes.js";
import voiceRoutes from "./modules/voice/voice.routes.js";
import resumeRoutes from "./modules/resume/resume.routes.js";
import meRoutes from "./routes/me.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import mcqHistoryRoutes from "./routes/mcqHistory.routes.js";
import voiceHistoryRoutes from "./routes/voiceHistory.routes.js";
import insightsRoutes from "./routes/insights.routes.js";

const app = express();

app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  })
);
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/mcq", mcqRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/me", meRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/mcq", mcqHistoryRoutes);
app.use("/api/voice", voiceHistoryRoutes);
app.use("/api/insights", insightsRoutes);

// apply limiter to heavy endpoints
app.use("/api/mcq/start", aiLimiter);
app.use("/api/voice/upload", aiLimiter);
app.use("/api/voice/submit", aiLimiter);
app.use("/api/resume/analyze", aiLimiter);

export default app;