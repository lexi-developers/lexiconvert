
# LexiConvert

<p align="center">
  <img src="https://placehold.co/600x300.png" alt="LexiConvert Banner" data-ai-hint="abstract document conversion" />
</p>

<p align="center">
  <strong>一款功能強大、注重隱私的現代檔案轉換工具，完全在您的瀏覽器中運行。</strong>
</p>

---

## 🚀 關於 LexiConvert

LexiConvert 是一款專為注重隱私和效率的使用者設計的檔案轉換應用程式。與傳統的線上轉換工具不同，LexiConvert 利用瀏覽器的強大能力在本地執行所有轉換任務。這意味著您的檔案永遠不會離開您的電腦，從根本上保障了資料的絕對安全和私密性。無論您需要將圖片轉換為 PDF、從 PDF 中提取圖片，還是處理其他多種格式，LexiConvert 都能提供一個流暢、安全且高效的解決方案。

**核心功能:**
*   **本地處理**: 所有檔案轉換都在您的瀏覽器中完成，您的資料 100% 安全。
*   **多格式支援**: 支援文件、圖片、音訊和影片等多種檔案格式之間的轉換。
*   **批次處理**: 輕鬆上傳多個檔案，並將其轉換為您需要的格式。
*   **歷史記錄**: 自動保存您的轉換歷史，方便您隨時下載或管理過去的檔案。
*   **安全鎖定**:可選的密碼功能可保護您的會話，防止未經授權的存取。
*   **現代化介面**: 採用 Next.js、Tailwind CSS 和 shadcn/ui 打造，介面美觀、反應迅速。

---

## 🛠️ 快速開始 (本地部署)

您可以在自己的電腦上輕鬆部署並運行 LexiConvert。請遵循以下步驟：

1.  **複製儲存庫**
    首先，使用 `git` 將專案複製到您的本地電腦。
    ```bash
    git clone https://github.com/your-username/lexiconvert.git
    cd lexiconvert
    ```

2.  **安裝依賴套件**
    我們使用 `npm` 來管理專案的套件。執行以下指令來安裝所有必要的依賴項。
    ```bash
    npm install
    ```

3.  **運行開發伺服器**
    安裝完成後，您可以啟動本地開發伺服器。
    ```bash
    npm run dev
    ```

4.  **打開應用程式**
    現在，打開您的瀏覽器並訪問 [http://localhost:9002](http://localhost:9002)。您應該能看到 LexiConvert 正在運行！

---

## 🔒 安全策略

我們將您的資料安全和隱私視為最高優先。以下是 LexiConvert 採用的安全措施：

*   **客戶端處理**: 這是我們最核心的安全承諾。所有檔案的讀取、處理和轉換完全在您的瀏覽器沙箱環境中進行。任何檔案資料都不會被上傳到任何伺服器。

*   **本地儲存**: 您的轉換歷史（包括檔案本身）使用瀏覽器的 `IndexedDB` 技術安全地儲存在您的本機。這使得即使您關閉瀏覽器，也能保留您的工作成果，同時確保資料不會外洩。

*   **會話密碼保護 (可選)**:
    *   在首次使用時，您可以選擇設定一個密碼來保護您的應用程式。
    *   如果設定了密碼，每次打開或重新整理頁面時，都必須輸入密碼才能存取您的轉換歷史。

*   **漸進式暴力破解防護**:
    *   為了防止密碼被猜測，我們實作了一個漸進式的鎖定機制。
    *   連續 10 次密碼錯誤將導致帳戶鎖定 1 分鐘。
    *   之後的 2 次錯誤將鎖定 1 小時。
    *   如果再錯 2 次，工具將被永久停用，直到您選擇手動刪除所有本地資料（包括密碼和歷史記錄）以重置應用。

---

## ❤️ 致謝

LexiConvert 的誕生離不開以下這些卓越的開源專案。我們對這些專案的開發者和貢獻者表示最誠摯的感謝！

*   **框架與建構工具**
    *   [Next.js](https://nextjs.org/) - React 應用程式框架。
    *   [React](https://react.dev/) - 用於建構使用者介面的函式庫。
    *   [Tailwind CSS](https://tailwindcss.com/) - 一個實用程式優先的 CSS 框架。

*   **UI 與動畫**
    *   [shadcn/ui](https://ui.shadcn.com/) - 一套可重複使用的元件集合。
    *   [Lucide React](https://lucide.dev/) - 一套美觀、一致的圖示。
    *   [Framer Motion](https://www.framer.com/motion/) - 一個用於 React 的強大動畫函式庫。

*   **核心功能函式庫**
    *   [pdf-lib](https://pdf-lib.js.org/) - 用於建立和修改 PDF 檔案。
    *   [react-pdf](https://github.com/wojtekmaj/react-pdf) - 在 React 應用中顯示 PDF。
    *   [JSZip](https://github.com/Stuk/jszip) - 用於建立、讀取和修改 .zip 檔案。
    *   [idb](https://github.com/jakearchibald/idb) - IndexedDB 的輕量級包裝。
    *   [epub.js](https://github.com/futurepress/epub.js) - 用於解析和渲染 EPUB 檔案。
    *   [Potrace](https://github.com/tooolit/potrace) - 將點陣圖轉換為向量圖形。
    *   [SheetJS](https://github.com/SheetJS/sheetjs) - 用於處理試算表檔案。

沒有開源社群的辛勤工作和無私奉獻，像 LexiConvert 這樣的專案就不可能存在。
