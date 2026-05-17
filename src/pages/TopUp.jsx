import { useState } from "react";
import { ArrowLeft, TrendingUp, Wallet, AlertCircle, Zap, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NOMINALS = [50000, 100000, 150000, 200000, 300000, 500000];

const formatRupiah = (value) => new Intl.NumberFormat("id-ID").format(value);

export default function TopUp() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const MIN_TOPUP = 50000;

  const numericAmount = Number(amount || 0);
  const isValidAmount = numericAmount >= MIN_TOPUP;

  const handleNominalClick = (nominal) => {
    setAmount(String(nominal));
  };

  const handleContinue = () => {
    navigate(`/paycheck?amount=${numericAmount}&note=${encodeURIComponent(note)}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)" }}>

      {/* HEADER */}
      <div style={{
        position: "sticky", top: 0,
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0", zIndex: 10
      }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => window.history.back()}
            style={{ padding: "8px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer" }}
          >
            <ArrowLeft size={20} color="#374151" />
          </button>
          <TrendingUp size={22} color="#2563eb" />
          <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111827" }}>Top Up Saldo</h1>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", paddingBottom: "120px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* BALANCE PREVIEW CARD */}
        <div style={{
          background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
          borderRadius: "20px", padding: "20px 24px",
          boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
          position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", background: "rgba(255,255,255,0.08)", borderRadius: "50%" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Wallet size={16} color="rgba(255,255,255,0.85)" />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", fontWeight: "500" }}>Jumlah Top Up</span>
            </div>
            <p style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#ffffff" }}>
              Rp {amount ? formatRupiah(numericAmount) : "0"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
              <CheckCircle size={12} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
                Minimum top up Rp {formatRupiah(MIN_TOPUP)}
              </span>
            </div>
          </div>
        </div>

        {/* NOMINAL CEPAT */}
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Zap size={16} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#111827" }}>Nominal Cepat</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {NOMINALS.map((nominal) => {
              const isSelected = Number(amount) === nominal;
              return (
                <button
                  key={nominal}
                  onClick={() => handleNominalClick(nominal)}
                  style={{
                    position: "relative",
                    padding: "12px 8px",
                    borderRadius: "12px",
                    border: isSelected ? "2px solid #3b82f6" : "2px solid #e2e8f0",
                    background: isSelected ? "#eff6ff" : "#ffffff",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                    color: isSelected ? "#1d4ed8" : "#374151",
                    transition: "all 0.15s",
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: "absolute", top: "-6px", right: "-6px",
                      width: "18px", height: "18px",
                      background: "#3b82f6", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <CheckCircle size={11} color="#ffffff" />
                    </div>
                  )}
                  <div style={{ fontSize: "10px", color: isSelected ? "#3b82f6" : "#9ca3af", marginBottom: "2px" }}>Rp</div>
                  {formatRupiah(nominal)}
                </button>
              );
            })}
          </div>
        </div>

        {/* NOMINAL CUSTOM */}
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "18px" }}>✏️</span>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#111827" }}>Nominal Lainnya</h3>
          </div>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
              fontSize: "15px", fontWeight: "700", color: "#6b7280"
            }}>Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setAmount(val);
              }}
              onFocus={() => setFocusedField("amount")}
              onBlur={() => setFocusedField("")}
              style={{
                width: "100%",
                border: `2px solid ${amount && !isValidAmount ? "#f87171" : focusedField === "amount" ? "#3b82f6" : "#e2e8f0"}`,
                borderRadius: "12px",
                padding: "12px 12px 12px 40px",
                fontSize: "16px",
                fontWeight: "700",
                outline: "none",
                color: "#111827",
                background: "#fafafa",
                transition: "border 0.15s",
              }}
            />
          </div>
          {amount && !isValidAmount && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", padding: "8px 12px", background: "#fef2f2", borderRadius: "8px" }}>
              <AlertCircle size={13} color="#ef4444" />
              <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: "500" }}>
                Minimum top up Rp {formatRupiah(MIN_TOPUP)}
              </span>
            </div>
          )}
          {amount && isValidAmount && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", padding: "8px 12px", background: "#f0fdf4", borderRadius: "8px" }}>
              <CheckCircle size={13} color="#22c55e" />
              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "500" }}>Nominal valid</span>
            </div>
          )}
        </div>

        {/* CATATAN */}
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "16px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "18px" }}>📝</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#111827" }}>Catatan</h3>
              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Opsional</p>
            </div>
          </div>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            onFocus={() => setFocusedField("note")}
            onBlur={() => setFocusedField("")}
            placeholder="Contoh: Top up untuk pesanan hari ini"
            style={{
              width: "100%",
              border: `2px solid ${focusedField === "note" ? "#3b82f6" : "#e2e8f0"}`,
              borderRadius: "12px",
              padding: "10px 12px",
              fontSize: "13px",
              resize: "none",
              outline: "none",
              color: "#374151",
              background: "#fafafa",
              fontFamily: "inherit",
              transition: "border 0.15s",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>{note.length}/200 karakter</span>
            {note && (
              <button
                onClick={() => setNote("")}
                style={{ fontSize: "11px", color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: "600" }}
              >
                Hapus
              </button>
            )}
          </div>
        </div>

        {/* INFO */}
        <div style={{
          background: "linear-gradient(135deg, #eff6ff, #eef2ff)",
          borderRadius: "14px", padding: "16px",
          border: "1px solid #bfdbfe"
        }}>
          <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: "700", color: "#1e40af" }}>ℹ️ Informasi</p>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#1d4ed8", lineHeight: "1.8" }}>
            <li>Saldo masuk dalam 5–15 menit setelah verifikasi</li>
            <li>Pastikan nominal transfer sesuai yang tertera</li>
            <li>Simpan bukti transfer untuk konfirmasi</li>
          </ul>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        borderTop: "1px solid #e2e8f0",
        padding: "16px", zIndex: 20
      }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Total Top Up</p>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#2563eb" }}>
              Rp {amount ? formatRupiah(numericAmount) : "0"}
            </p>
          </div>
          <button
            disabled={!isValidAmount}
            onClick={handleContinue}
            style={{
              padding: "14px 28px",
              borderRadius: "14px",
              border: "none",
              background: isValidAmount
                ? "linear-gradient(135deg, #3b82f6, #4f46e5)"
                : "#e2e8f0",
              color: isValidAmount ? "#ffffff" : "#9ca3af",
              fontWeight: "800",
              fontSize: "15px",
              cursor: isValidAmount ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: "8px",
              transition: "all 0.2s",
              boxShadow: isValidAmount ? "0 4px 16px rgba(59,130,246,0.4)" : "none",
            }}
          >
            Lanjutkan →
          </button>
        </div>
      </div>
    </div>
  );
}
