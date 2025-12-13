"use client";

import { useState, useEffect, useCallback } from "react";
import {
  EC2Status,
  EventBridgeRuleInfo,
  StartInstanceResponse,
  StatusResponse,
} from "@/types/ec2";

const DURATION_OPTIONS = [
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "4 hours", value: 240 },
  { label: "8 hours", value: 480 },
];

export default function EC2Controller() {
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<EC2Status | null>(null);
  const [activeRule, setActiveRule] = useState<EventBridgeRuleInfo | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/ec2/status");
      const data: StatusResponse = await response.json();

      if (data.success) {
        setStatus(data.instanceStatus || null);
        setActiveRule(data.activeRule || null);
      }
    } catch (err) {
      console.error("Error fetching status:", err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Calculate time remaining
  useEffect(() => {
    if (!activeRule) {
      setTimeRemaining(null);
      return;
    }

    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const scheduled = new Date(activeRule.scheduledTime).getTime();
      const diff = scheduled - now;

      if (diff <= 0) {
        setTimeRemaining("Shutting down...");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [activeRule]);

  const handleStart = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ec2/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: duration }),
      });

      const data: StartInstanceResponse = await response.json();

      if (data.success) {
        setStatus(data.instanceStatus || null);
        setActiveRule(data.shutdownSchedule || null);
      } else {
        setError(data.error || "Failed to start instance");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      fetchStatus();
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ec2/stop", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setActiveRule(null);
      } else {
        setError(data.error || "Failed to stop instance");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      fetchStatus();
    }
  };

  const getStatusClass = (state: string) => {
    if (state === "running") return "status-running";
    if (state === "pending" || state === "stopping") return "status-pending";
    return "status-stopped";
  };

  const isRunningOrPending =
    status?.state === "running" || status?.state === "pending";

  return (
    <div className="card">
      <h1
        style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.5rem" }}
      >
        EC2 Game Server
      </h1>
      <p className="text-secondary mb-4">
        Control your EC2 instance with automatic shutdown
      </p>

      {/* Status Display */}
      {status && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-secondary">Status:</span>
            <span className={`status-badge ${getStatusClass(status.state)}`}>
              {status.state}
            </span>
          </div>

          {status.publicIp && (
            <div className="flex justify-between mb-1">
              <span className="text-secondary">Public IP:</span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: "var(--primary-light)",
                }}
              >
                {status.publicIp}
              </span>
            </div>
          )}

          {activeRule && timeRemaining && (
            <div className="flex justify-between mb-1">
              <span className="text-secondary">Shutdown in:</span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: "var(--warning)",
                  fontWeight: "600",
                  fontSize: "1.1rem",
                }}
              >
                {timeRemaining}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: "1rem",
            background: "hsla(4, 90%, 58%, 0.1)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius)",
            marginBottom: "1rem",
            color: "var(--danger-light)",
          }}
        >
          {error}
        </div>
      )}

      {/* Duration Selection */}
      <div className="mb-3">
        <label
          htmlFor="duration"
          className="text-secondary mb-2"
          style={{ display: "block" }}
        >
          Run Duration:
        </label>
        <select
          id="duration"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          disabled={loading}
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleStart}
          disabled={loading || isRunningOrPending}
          className="btn btn-success"
          style={{ flex: 1 }}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Starting...
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Start Server
            </>
          )}
        </button>

        <button
          onClick={handleStop}
          disabled={loading || !isRunningOrPending}
          className="btn btn-danger"
          style={{ flex: 1 }}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Stopping...
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              Stop Server
            </>
          )}
        </button>
      </div>

      <p
        className="text-muted mt-3"
        style={{ fontSize: "0.875rem", textAlign: "center" }}
      >
        {activeRule
          ? "Server will automatically shutdown when timer expires"
          : "Select a duration and start the server"}
      </p>
    </div>
  );
}
