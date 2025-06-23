import { thumbnailData } from "/data/thumbnailData.js";
import { getId, getThumbnailUrl } from "./components/getThumbnailActions.js";

const messageDiv = document.getElementById('message');
const manifestData = chrome.runtime.getManifest();
const fileName = document.getElementById('filename-input');
const filenameCheckbox = document.getElementById('filename-checkbox');
const fileTypeRadio = document.querySelectorAll('input[name="filetype-radio"]')
const filenameAddSize = document.getElementById('filename-add-size-checkbox');
const thumbnailListSort = document.getElementById('thumbnail-list-sort');
const thumbnailList = document.getElementById('thumbnail-list');

let isSaveFilename = false;
let saveFilename = null;
let savefilenameAddSize = true;

chrome.storage.local.get(['settings'], (data) => {
  const settings = data.settings || {};
  // console.log("settings", settings);
  loading(settings);
  chrome.storage.local.set({ settings: settings });
});

function loading(settings) {
  const fileType = settings.fileType || 'png';
  isSaveFilename = settings.saveFilename || false;
  saveFilename = settings.fileName || null;
  savefilenameAddSize = settings.filenameAddSize;

  filenameCheckbox.checked = settings.saveFilename;
  filenameCheckbox.addEventListener('change', () => {
    settings.saveFilename = filenameCheckbox.checked;
    settings.fileName = document.getElementById('filename-input').value;
    messageOutput(dateTime(), `ファイル名: ${settings.fileName}${settings.saveFilename ? '（記憶する）' : ''}に変更`);
    chrome.storage.local.set({ settings: settings });
  });

  filenameAddSize.checked = savefilenameAddSize;
  filenameAddSize.addEventListener('change', () => {
    settings.filenameAddSize = filenameAddSize.checked;
    messageOutput(dateTime(), `ファイル名の末尾にサイズを${settings.filenameAddSize ? "付ける" : "付けない"} に変更`);
    chrome.storage.local.set({ settings: settings });
  });

  fileTypeRadio.forEach((radio) => {
    if (radio.value === fileType) {
      radio.checked = true;
    }
    radio.addEventListener('change', () => {
      settings.fileType = radio.value;
      messageOutput(dateTime(), `ファイル形式: ${radio.value} に変更 `);
      chrome.storage.local.set({ settings: settings });
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const siteUrlInput = document.getElementById('site-url-input');
  const siteUrlButton = document.getElementById('site-url-button');

  getActiveTabUrlAndProcess();

  siteUrlButton.addEventListener('click', getActiveTabUrlAndProcess);
  siteUrlInput.addEventListener('input', () => {
    const value = siteUrlInput.value.trim();
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
    if (!urlPattern.test(value)) {
      messageOutput(dateTime(), `無効なURLです: ${value}`);
      return;
    }
    const url = new URL(value);
    if (!url || !url.hostname) return;
    const hostname = url.hostname;
    fileName.value = hostname.replace(/\./g, '_');
    messageOutput(dateTime(), `サムネイルを取得します`);
    updateThumbnailUrls(hostname, url);
  });

  function getActiveTabUrlAndProcess() {
    console.log('getActiveTabUrlAndProcess');
    getActiveTabUrl((baseUrl, hostname, url) => {
      console.log('baseUrl', baseUrl, hostname, url);
      if (baseUrl) {
        siteUrlInput.value = url.href;
        messageOutput(dateTime(), `サムネイルを取得します`);
        const filename_header = hostname.replace(/\./g, '_');
        if (isSaveFilename) {
          fileName.value = saveFilename;
        } else {
          fileName.value = filename_header;
        }
        updateThumbnailUrls(hostname, url);
      }
    });
  }

  document.getElementById('url-clear-button').onclick = () => {
    siteUrlInput.value = '';
    siteUrlInput.focus();
  };

  document.getElementById('filename-clear-button').onclick = () => {
    const fileNameInput = document.getElementById('filename-input');
    fileNameInput.value = '';
    fileNameInput.focus();
  };

  const name = "Easy Thumbnail Downloader";
  const title = document.getElementById('title');
  title.textContent = name;
  const titleHeader = document.getElementById('title-header');
  titleHeader.textContent = name;

  const newTabButton = document.getElementById('new-tab-button');
  newTabButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'popup/popup.html' });
  });

  // 情報タブ:
  const extensionLink = document.getElementById('extension_link');
  extensionLink.href = `chrome://extensions/?id=${chrome.runtime.id}`;
  if (extensionLink) clickURL(extensionLink);
  const issueLink = document.getElementById('issue-link');
  if (issueLink) clickURL(issueLink);
  const storeLink = document.getElementById('store_link');
  if (storeLink) clickURL(storeLink);

  document.getElementById('extension-id').textContent = `${chrome.runtime.id}`;
  document.getElementById('extension-name').textContent = `${manifestData.name}`;
  document.getElementById('extension-version').textContent = `${manifestData.version}`;
  document.getElementById('extension-description').textContent = `${manifestData.description}`;
  chrome.permissions.getAll((result) => {
    let siteAccess;
    if (result.origins.length > 0) {
      if (result.origins.includes("<all_urls>")) {
        siteAccess = "すべてのサイト";
      } else {
        siteAccess = result.origins.join("<br>");
      }
    } else {
      siteAccess = "クリックされた場合のみ";
    }
    document.getElementById('site-access').innerHTML = siteAccess;
  });
  chrome.extension.isAllowedIncognitoAccess((isAllowedAccess) => {
    document.getElementById('incognito-enabled').textContent = `${isAllowedAccess ? '有効' : '無効'}`;
  });
  const githubLink = document.getElementById('github-link');
  if (githubLink) clickURL(githubLink);
  document.getElementById('clear-button').addEventListener('click', () => {
    messageDiv.innerHTML = '<p class="m-0">' + '' + '</p>';
  });
});




/** * サムネイルのURLを更新し，リストに追加する
 * @param {string} hostname 例: "www.youtube.com"
 * @param {string} url 例: "https://www.youtube.com/watch?v=VIDEO_ID"
 */
function updateThumbnailUrls(hostname, url) {
  const thumbnail = thumbnailData[hostname];
  if (!thumbnail) {
    notFoundThumbnail(hostname);
    return;
  }
  console.log('updateThumbnailUrls', hostname, url, thumbnail.getIdFuncName);
  const videoId = getId[thumbnail.getIdFuncName](url);
  const sizes = Object.keys(thumbnail.sizes);
  thumbnailList.innerHTML = '';
  const metadataPromises = sizes.map((key, index) => {
    const size = thumbnail.sizes[key];
    const url = getThumbnailUrl[hostname](thumbnail.baseUrl, videoId, size.name);

    return getImageMetadata(url, index, sizes).then(metadata => {
      if (!metadata) return null;

      const listItem = createListItem(metadata.width, metadata.height, url, size);
      thumbnailList.appendChild(listItem);
      const downloadLink = listItem.querySelector('a');
      handleDownloadClick(downloadLink, listItem);
      return true; // 成功したことを示す任意の値
    });
  });

  Promise.all(metadataPromises).then(() => {
    // すべての getImageMetadata が完了した後に実行
    thumbnailListSort.innerHTML = '';
    thumbnailListSort.appendChild(createSortButton());
  });
}

function notFoundThumbnail(hostname) {
  messageOutput(dateTime(), `サムネイルが見つかりません: ${hostname}`);
  thumbnailList.innerHTML = `
    <div class="text-center">
      <p>${hostname} のサムネイルが見つかりません．</p>
      <p>対応していないサイトか，URLが正しくない可能性があります．</p>
      <p>対応しているサイト一覧
        <a id="document-list" href="#document" data-bs-target="#document-tab" >
          こちら
        </a>
      </p>
    </div>
  `;
  thumbnailList.querySelector(`#document-list`)
    .addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.querySelector(event.currentTarget.getAttribute("data-bs-target"));
      if (target) {
        const tab = new bootstrap.Tab(target);
        tab.show();
      }
    });
}

/** * アクティブなタブのURLを取得し，コールバック関数を実行する
 * @param {function} callback コールバック関数
 * @returns {void}
 */
function getActiveTabUrl(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    if (!tabs[0].url) return;
    const url = new URL(tabs[0].url);
    const baseUrl = url.origin;
    const hostname = url.hostname;
    callback(baseUrl, hostname, url);
  });
}

/** * 画像のメタデータを取得する
 * @param {string} imageUrl 画像のURL
 * @return {Promise<Object|null>} 画像のメタデータ（幅，高さ，Blob）またはnull
 */
function getImageMetadata(imageUrl) {
  return fetch(imageUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('画像の取得に失敗しました');
      }
      return response.blob();
    })
    .then(blob => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = function () {
          resolve({
            width: img.width,
            height: img.height,
            blob: blob
          });
        };
        img.onerror = function () {
          resolve(null);
        };
        img.src = URL.createObjectURL(blob);
      });
    })
    .catch(() => {
      return null;
    });
}


const sortDownAlt = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-down-alt" viewBox="0 0 16 16">
      <path d="M3.5 3.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 12.293zm4 .5a.5.5 0 0 1 0-1h1a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h3a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h5a.5.5 0 0 1 0 1zM7 12.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5"/>
    </svg>
  `;
const sortUpAlt = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sort-up" viewBox="0 0 16 16">
    <path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.5.5 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>
  </svg>`;


function createSortButton() {
  const sortButton = document.createElement('button');
  sortButton.classList.add('btn-light', 'btn', 'btn-sm', 'me-2', 'p-1');
  sortButton.innerHTML = sortDownAlt;
  sortButton.setAttribute('data-sort', 'down');
  handleSortButtonClick();
  sortButton.addEventListener('click', () => {
    const currentSort = sortButton.getAttribute('data-sort');
    toggleSortIcon(currentSort);
    // Sort the thumbnails by size
    handleSortButtonClick();
  }, false);
  return sortButton;

  function handleSortButtonClick() {
    const thumbnails = Array.from(thumbnailList.children);
    thumbnails.sort((a, b) => {
      const sizeA = parseFloat(a.getAttribute('data-size'));
      const sizeB = parseFloat(b.getAttribute('data-size'));
      return sizeA - sizeB;
    });
    if (sortButton.getAttribute('data-sort') === 'up') {
      thumbnails.reverse();
    }
    thumbnails.forEach((thumbnail) => thumbnailList.appendChild(thumbnail));
    console.log('ソート後');
  }

  function toggleSortIcon(currentSort) {
    if (currentSort === 'down') {
      sortButton.innerHTML = sortUpAlt;
      sortButton.setAttribute('data-sort', 'up');
    } else {
      sortButton.innerHTML = sortDownAlt;
      sortButton.setAttribute('data-sort', 'down');
    }
  }
}

/** * リストアイテムを作成する
 * @param {number} width 画像の幅
 * @param {number} height 画像の高さ
 * @param {string} size サムネイルのサイズ名
 * @param {string} thumbnailUrl サムネイルのURL
 * @return {HTMLElement} 作成されたリストアイテム
 */
function createListItem(width, height, thumbnailUrl, sizeData) {
  console.log('createListItem', width, height, sizeData, thumbnailUrl);
  const listItem = document.createElement('li');
  listItem.id = `thumbnail-${sizeData.name}-item`;
  listItem.classList.add('list-group-item');
  listItem.setAttribute('data-size', sizeData.size);
  listItem.innerHTML = `
    <div class="mb-1">${width} × ${height} [ ${sizeData.name} ]</div>
    <div class="d-flex align-items-center justify-content-between w-100">
      <div class="thumbnail"><img id="thumbnail-${sizeData.name}" src=${thumbnailUrl} alt="サムネイル" class="thumbnail-img border rounded me-3" width=${width / 1.5} height=${height / 1.5}></div>
      <a href="#" data-size="${sizeData.name}" class="text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"></path>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"></path>
        </svg>
      </a>
    </div>
  `;
  return listItem;
}

/** * ダウンロードリンクのクリックイベントを処理する
 * @param {HTMLElement} link ダウンロードリンク
 * @param {HTMLElement} target リストアイテムのターゲット要素
 */
function handleDownloadClick(link, target) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const size = link.getAttribute("data-size");
    console.log('イベントハンドラ', link, target, size);
    const fileNameValue = document.getElementById('filename-from').value;
    const saveFilenameAddSize = document.getElementById('filename-add-size-checkbox').checked;
    const siteUrl = document.getElementById('site-url-from').value;
    const baseUrl = new URL(siteUrl).origin;

    const fileType = document.querySelector('input[name="filetype-radio"]:checked').value;
    const img = target.querySelector(`#thumbnail-${size}`);
    if (!img) return;
    const imgUrl = img.src;
    console.log('imgUrl', img, imgUrl, size, fileNameValue, fileType, saveFilenameAddSize);

    fetch(img.src, { mode: 'cors' })
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = savefilenameAddSize ? `${fileNameValue}_${size}.${fileType}` : `${fileNameValue}.${fileType}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        messageOutput(dateTime(), `${baseUrl}のサイズ${size}のサムネイルをダウンロードしました`);
      })
      .catch(error => {
        messageOutput(dateTime(), `サイズ${size}のサムネイルのダウンロードに失敗しました`);
      });
  });
}

/** * リンクをクリックしたときに新しいタブで開く
 * @param {HTMLElement|string} link リンク要素またはURL文字列
 */
function clickURL(link) {
  const url = link.href ? link.href : link;

  if (link instanceof HTMLElement) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      chrome.tabs.create({ url });
    });
  }
}

/** * メッセージを出力する
 * @param {string} datetime 日時
 * @param {string} message メッセージ
 */
function messageOutput(datetime, message) {
  messageDiv.innerHTML += '<p class="m-0">' + datetime + ' ' + message + '</p>';
}

/** * 現在の日時をフォーマットして返す
 * @returns {string} フォーマットされた日時文字列
 */
function dateTime() {
  const now = new Date();
  const year = now.getFullYear();                                    // 年
  const month = String(now.getMonth() + 1).padStart(2, '0');         // 月（0始まりのため+1）
  const day = String(now.getDate()).padStart(2, '0');                // 日
  const hours = String(now.getHours()).padStart(2, '0');             // 時
  const minutes = String(now.getMinutes()).padStart(2, '0');         // 分

  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}`;
  return formattedDateTime;
}
