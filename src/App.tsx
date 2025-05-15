import styles from "./App.module.css";
import { Board } from "./Board/Board.tsx";

export function App() {
  return (
    <div className={styles.root}>
      <Board />
    </div>
  );
}
