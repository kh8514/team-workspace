import { STYLE } from '../../constants/theme';

/** 풀스크린 오버레이 모달 */
function Modal({ children, onClose, maxWidth = 480 }) {
  return (
    <div
      style={STYLE.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        style={{
          background: '#1a1a1f',
          border: '1.5px solid #2e2e38',
          borderRadius: 18,
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'modalIn .2s ease',
          scrollbarWidth: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
