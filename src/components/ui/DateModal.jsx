import Modal from './Modal';
import { STYLE, COLORS } from '../../constants/theme';

/** 날짜 편집 모달 (칸반 + 달력 공용) */
function DateModal({ startDate, endDate, onChange, onSave, onDelete, onClose }) {
  return (
    <Modal onClose={onClose} maxWidth={340}>
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 18 }}>
          기간 설정
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>
            시작일
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              const newStart = e.target.value;
              onChange({ startDate: newStart, endDate: (!endDate || endDate < newStart) ? newStart : endDate });
            }}
            style={{ ...STYLE.input, width: '100%' }}
            onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
            onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, marginBottom: 6, letterSpacing: '.3px' }}>
            종료일
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChange({ startDate, endDate: e.target.value })}
            style={{ ...STYLE.input, width: '100%' }}
            onFocus={(e) => (e.target.style.borderColor = COLORS.accent)}
            onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{ flex: 1, background: 'rgba(248,113,113,.15)', border: 'none', borderRadius: 8, color: COLORS.danger, cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: 10 }}
            >
              삭제
            </button>
          )}
          <button
            onClick={onClose}
            style={{ flex: 1, background: COLORS.bgInput, border: 'none', borderRadius: 8, color: COLORS.textSecondary, cursor: 'pointer', fontFamily: 'Noto Sans KR, sans-serif', fontSize: 14, fontWeight: 500, padding: 10 }}
          >
            취소
          </button>
          <button
            onClick={onSave}
            style={{ flex: 1, ...STYLE.btnPrimary, borderRadius: 8, fontSize: 14, fontWeight: 500, padding: 10 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.accentLight)}
            onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.accent)}
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default DateModal;
