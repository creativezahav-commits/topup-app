import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, CheckCircle, XCircle, Clock, RefreshCw, Copy, Wifi, WifiOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";

const API_KEY = "lv_bb03150291104885b3cf8d0e9f888a4b";
const BASE_URL = "https://api.louvin.dev";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0
  }).format(value || 0);

function CountdownTimer({ expiredAt, onExpired }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiredAt) return;
    const tick = () => {
      const diff = new Date(expiredAt) - new Date();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft("00:00");
        onExpired?.();
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiredAt]);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "6px 14px", borderRadius: "999px",
      background: expired ? "#fef2f2" : "#fefce8",
      border: `1px solid ${expired ? "#fca5a5" : "#fde68a"}`,
    }}>
      <Clock size={13} color={expired ? "#ef4444" : "#d97706"} />
      <span style={{ fontSize: "13px", fontWeight: "700", color: expired ? "#dc2626" : "#b45309", fontVariantNumeric: "tabular-nums" }}>
        {expired ? "Kedaluwarsa" : timeLeft}
      </span>
    </div>
  );
}

export default function Paycheck() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const amount = Number(searchParams.get("amount") || 50000);
  const note = searchParams.get("note") || "";

  const [phase, setPhase] = useState("loading"); // loading | qr | settled | failed | error
  const [transaction, setTransaction] = useState(null);
  const [payment, setPayment] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);

  const stopPolling = () => clearInterval(pollRef.current);

  const pollStatus = useCallback(async (txId) => {
    try {
      const res = await fetch(`${BASE_URL}/check-status?id=${txId}`, {
        headers: { "x-api-key": API_KEY }
      });
      const data = await res.json();
      if (data?.transaction?.status === "settled") {
        setTransaction(data.transaction);
        setPhase("settled");
        stopPolling();
      } else if (data?.transaction?.status === "failed") {
        setPhase("failed");
        stopPolling();
      }
      setPollCount(c => c + 1);
    } catch (_) {}
  }, []);

  const createTransaction = useCallback(async () => {
    setPhase("loading");
    setErrorMsg("");
    setQrDataUrl(null);
    stopPolling();

    try {
      const res = await fetch(`${BASE_URL}/create-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify({
          amount,
          payment_type: "qris",
          customer_name: "Customer",
          description: note || `Top Up Rp ${amount.toLocaleString("id-ID")}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `Gagal (${res.status})`);

      setTransaction(data.transaction);
      setPayment(data.payment);

      // Generate QR image dari qr_string
      const url = await QRCode.toDataURL(data.payment.qr_string, {
        width: 260, margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" }
      });
      setQrDataUrl(url);
      setPhase("qr");
      setPollCount(0);

      // Start polling setiap 3 detik
      pollRef.current = setInterval(() => pollStatus(data.transaction.id), 3000);
    } catch (err) {
      setErrorMsg(err.message || "Terjadi kesalahan, coba lagi.");
      setPhase("error");
    }
  }, [amount, note, pollStatus]);

  useEffect(() => {
    createTransaction();
    return () => stopPolling();
  }, []);

  const handleCopy = async () => {
    if (payment?.qr_string) {
      await navigator.clipboard.writeText(payment.qr_string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #f0fdf4 100%)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* HEADER */}
      <div style={{
        position: "sticky", top: 0,
        background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0", zIndex: 10
      }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: "8px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer" }}
          >
            <ArrowLeft size={20} color="#374151" />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>Pembayaran QRIS</h1>
            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>via Louvin Payment Gateway</p>
          </div>
          <div>
            {phase === "qr" ? <Wifi size={16} color="#10b981" /> : <WifiOff size={16} color="#9ca3af" />}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", paddingBottom: "100px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* ---- LOADING ---- */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{
              width: "60px", height: "60px",
              border: "4px solid #e2e8f0", borderTopColor: "#3b82f6",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
              margin: "0 auto 20px"
            }} />
            <p style={{ color: "#374151", fontWeight: "600", fontSize: "15px" }}>Membuat transaksi...</p>
            <p style={{ color: "#9ca3af", fontSize: "13px", marginTop: "6px" }}>Mohon tunggu sebentar</p>
          </div>
        )}

        {/* ---- ERROR ---- */}
        {phase === "error" && (
          <div style={{ background: "#fef2f2", borderRadius: "20px", padding: "32px 24px", textAlign: "center", border: "1px solid #fecaca", marginTop: "24px" }}>
            <XCircle size={52} color="#ef4444" style={{ marginBottom: "14px" }} />
            <h3 style={{ color: "#991b1b", margin: "0 0 8px", fontWeight: "700", fontSize: "18px" }}>Gagal Memproses</h3>
            <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 24px", lineHeight: "1.6" }}>{errorMsg}</p>
            <button onClick={createTransaction} style={btnPrimary}>
              <RefreshCw size={16} /> Coba Lagi
            </button>
          </div>
        )}

        {/* ---- QR / PENDING ---- */}
        {phase === "qr" && transaction && payment && (
          <>
            {/* Status badge */}
            <div style={{
              background: "#fefce8", borderRadius: "14px", padding: "14px 16px",
              display: "flex", alignItems: "flex-start", gap: "12px",
              border: "1px solid #fde68a"
            }}>
              <Clock size={22} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p style={{ margin: 0, fontWeight: "700", fontSize: "14px", color: "#92400e" }}>Menunggu Pembayaran</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#b45309" }}>Scan QR code di bawah dengan aplikasi e-wallet atau m-banking</p>
              </div>
            </div>

            {/* Amount card */}
            <div style={{
              background: "linear-gradient(135deg, #1e3a8a, #4f46e5)",
              borderRadius: "20px", padding: "20px 24px",
              boxShadow: "0 8px 32px rgba(59,130,246,0.25)",
              position: "relative", overflow: "hidden"
            }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(255,255,255,0.07)", borderRadius: "50%" }} />
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: "rgba(255,255,255,0.65)", fontWeight: "500" }}>Total Dibayar (termasuk biaya)</p>
              <p style={{ margin: "0 0 16px", fontSize: "30px", fontWeight: "900", color: "#fff" }}>
                {formatRupiah(payment.total_payment)}
              </p>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {[
                  ["Nominal Top Up", formatRupiah(transaction.net_amount)],
                  ["Biaya Layanan", formatRupiah(transaction.fee)],
                  ["Metode", "QRIS"],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#fff" }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timer & ref */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <CountdownTimer expiredAt={payment.expired_at} onExpired={() => setPhase("failed")} />
              <div style={{ fontSize: "11px", color: "#6b7280", background: "#f8fafc", padding: "5px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                Ref: <strong style={{ color: "#374151" }}>...{(transaction.reference || "").slice(-10)}</strong>
              </div>
            </div>

            {/* QR Code Box */}
            <div style={{
              background: "#ffffff", borderRadius: "20px", padding: "24px 20px",
              border: "1px solid #e2e8f0", textAlign: "center",
              boxShadow: "0 2px 16px rgba(0,0,0,0.05)"
            }}>
              {/* Polling indicator */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", marginBottom: "18px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: "12px", color: "#059669", fontWeight: "600" }}>
                  Menunggu pembayaran · cek {pollCount}x
                </span>
              </div>

              {qrDataUrl ? (
                <div>
                  <div style={{ display: "inline-block", background: "#fff", padding: "12px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                    <img src={qrDataUrl} alt="QR Code QRIS" style={{ display: "block", width: "220px", height: "220px", borderRadius: "8px" }} />
                  </div>
                  <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#9ca3af" }}>
                    Scan dengan GoPay · OVO · DANA · ShopeePay · m-banking
                  </p>
                </div>
              ) : (
                <div style={{ width: "220px", height: "220px", background: "#f1f5f9", borderRadius: "12px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#94a3b8", fontSize: "13px" }}>Memuat QR...</span>
                </div>
              )}

              <button onClick={handleCopy} style={{
                marginTop: "16px",
                padding: "8px 20px", borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: copied ? "#f0fdf4" : "#f8fafc",
                color: copied ? "#059669" : "#374151",
                cursor: "pointer", fontSize: "13px", fontWeight: "600",
                display: "inline-flex", alignItems: "center", gap: "6px"
              }}>
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? "Tersalin!" : "Salin QRIS String"}
              </button>
            </div>

            {/* Cara bayar */}
            <div style={{ background: "#eff6ff", borderRadius: "14px", padding: "14px 16px", border: "1px solid #bfdbfe" }}>
              <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: "700", color: "#1e40af" }}>📱 Cara Bayar</p>
              <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#1d4ed8", lineHeight: "2" }}>
                <li>Buka aplikasi GoPay, OVO, DANA, atau m-banking</li>
                <li>Pilih menu <strong>Scan QR</strong> atau <strong>QRIS</strong></li>
                <li>Arahkan kamera ke QR code di atas</li>
                <li>Konfirmasi jumlah <strong>{formatRupiah(payment.total_payment)}</strong></li>
                <li>Selesaikan — status otomatis terupdate</li>
              </ol>
            </div>
          </>
        )}

        {/* ---- SETTLED / SUKSES ---- */}
        {phase === "settled" && transaction && (
          <div style={{ marginTop: "24px" }}>
            <div style={{ background: "#ecfdf5", borderRadius: "24px", padding: "36px 24px", textAlign: "center", border: "1px solid #a7f3d0", boxShadow: "0 4px 24px rgba(16,185,129,0.12)" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
                boxShadow: "0 6px 24px rgba(16,185,129,0.35)"
              }}>
                <CheckCircle size={40} color="#fff" />
              </div>
              <h2 style={{ color: "#065f46", fontWeight: "800", margin: "0 0 8px", fontSize: "22px" }}>
                Pembayaran Berhasil! 🎉
              </h2>
              <p style={{ color: "#059669", margin: "0 0 24px", fontSize: "14px" }}>
                Top up telah dikonfirmasi oleh sistem
              </p>
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "16px", border: "1px solid #d1fae5", textAlign: "left" }}>
                {[
                  ["Jumlah Diterima", formatRupiah(transaction.net_amount)],
                  ["Biaya Layanan", formatRupiah(transaction.fee)],
                  ["Status", "Settled ✓"],
                  ["ID Transaksi", (transaction.id || "").slice(0, 18) + "..."],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0fdf4" }}>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>{label}</span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#059669" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- FAILED ---- */}
        {phase === "failed" && (
          <div style={{ background: "#fef2f2", borderRadius: "20px", padding: "32px 24px", textAlign: "center", border: "1px solid #fecaca", marginTop: "24px" }}>
            <XCircle size={52} color="#ef4444" style={{ marginBottom: "14px" }} />
            <h3 style={{ color: "#991b1b", margin: "0 0 8px", fontWeight: "700", fontSize: "18px" }}>Transaksi Gagal / Kedaluwarsa</h3>
            <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 24px", lineHeight: "1.6" }}>
              QR code sudah tidak berlaku atau pembayaran ditolak. Silakan buat transaksi baru.
            </p>
            <button onClick={createTransaction} style={btnPrimary}>
              <RefreshCw size={16} /> Buat Transaksi Baru
            </button>
          </div>
        )}

      </div>

      {/* FOOTER – hanya muncul saat sukses */}
      {phase === "settled" && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
          borderTop: "1px solid #e2e8f0", padding: "16px", zIndex: 20
        }}>
          <div style={{ maxWidth: "480px", margin: "0 auto" }}>
            <button onClick={() => navigate("/")} style={{ ...btnPrimary, width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 16px rgba(16,185,129,0.4)" }}>
              <CheckCircle size={20} /> Kembali ke Beranda
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.75); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const btnPrimary = {
  display: "inline-flex", alignItems: "center", gap: "8px",
  padding: "13px 26px", borderRadius: "14px", border: "none",
  background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
  color: "#ffffff", fontWeight: "700", fontSize: "14px",
  cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
  transition: "all 0.2s"
};
