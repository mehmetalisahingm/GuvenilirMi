import styles from "./live-scan-dock.module.css";

export function LiveScanDock() {
  return (
    <aside className={styles.dock} aria-label="Canlı site analizi">
      <div className={styles.copy}>
        <span className={styles.pulse} />
        <div>
          <strong>Gerçek tarama hazır</strong>
          <small>Bir URL gir, teknik sinyalleri canlı incele.</small>
        </div>
      </div>
      <form action="/analiz" method="get" className={styles.form}>
        <input name="url" type="text" placeholder="site.com" aria-label="Analiz edilecek web sitesi" autoComplete="url" />
        <button type="submit">Analiz et ↗</button>
      </form>
    </aside>
  );
}
