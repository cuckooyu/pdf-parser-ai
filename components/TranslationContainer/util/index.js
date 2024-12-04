
const handlePDFHightLight = (index, store) => {
    if (index == -1) {
        // -1代表播放完了
        let lastIndex = store.length - 1,
            lastCell = store[lastIndex],
            lastArr = [];
        if (lastCell) {
            if (lastCell.nextPagesQuery) {
                let tmp = concatNextPagesQuery(lastCell.nextPagesQuery)
                lastArr = [...lastCell.queryIndex, ...tmp];
            } else {
                lastArr = lastCell.queryIndex;
            }
            for (let i = 0; i < lastArr.length; i++) {
                let cellDom = document.querySelector(`[data-query-index="${lastArr[i]}"]`);
                if (cellDom) {
                    let prevStyle = cellDom.getAttribute('style');
                    let removeIndex = prevStyle.indexOf("line-height");
                    let newStyle = prevStyle.substring(0, removeIndex);
                    cellDom.setAttribute("style", newStyle)
                }
            }
        }
        return;
    }

    let currentArr = [];
    let prevArr = [];
    let current = store[index];
    if (current.nextPagesQuery) {
        let tmp = concatNextPagesQuery(current.nextPagesQuery);
        currentArr = [...current.queryIndex, ...tmp];
    } else {
        currentArr = current.queryIndex;
    }
    // 高亮新句子
    for (let i = 0; i < currentArr.length; i++) {
        let currentDom = document.querySelector(`[data-query-index="${currentArr[i]}"]`);
        if (currentDom) {
            let computedStyle = window.getComputedStyle(currentDom);
            let prevStyle = currentDom.getAttribute('style');
            let newStyle = prevStyle + `line-height:${computedStyle.fontSize};background:#ec417a;color:#fff;`
            currentDom.setAttribute("style", newStyle)
        }
    }
    // 去除旧语句高亮
    if (index > 0) {
        let prev = store[index - 1];
        if (current.group && current.group == prev.group) {
            // 仍在二次分割的区域内，不用清除
            return;
        }
        if (prev.nextPagesQuery) {
            let tmp = concatNextPagesQuery(prev.nextPagesQuery);
            prevArr = [...prev.queryIndex, ...tmp];
        } else {
            prevArr = prev.queryIndex;
        }
        for (let i = 0; i < prevArr.length; i++) {
            let prevDom = document.querySelector(`[data-query-index="${prevArr[i]}"]`);
            if (prevDom) {
                let prevStyle = prevDom.getAttribute('style');
                let removeIndex = prevStyle.indexOf("line-height:");
                let newStyle = prevStyle.substring(0, removeIndex);
                prevDom.setAttribute("style", newStyle)
            }
        }
    }
}

const getLanguageSample = (arr) => {
    let al = arr.length;
    let text = "";
    for (let i = 0; i < al; i++) {
        text = text + arr[i];
        if (text.length >= 15) {
            return text
        }
    }
}

const collectQuery = (obj) => {
    let result = "";
    if (obj.queryIndex) {
        result = obj.queryIndex.join();
    }
    if (obj.nextPagesQuery) {
        let al = obj.nextPagesQuery.length;
        let tmp = "";
        for (let i = 0; i < al; i++) {
            tmp += obj.nextPagesQuery[i].queryIndex.join();
        }
        result += "," + tmp;
    }
    return result;
}

const parseQueryStr = (str) => {
    if (!str) return;
    return str.split(",");
}

const highlightingCorrespondingTexts = (arr, syncPDF) => {
    let al = arr.length;
    let parent = document.querySelector('.PDF-container');
    let parentPosition = parent.getBoundingClientRect();
    let parentTop = parentPosition.top;
    let parentScrollTop = parent.scrollTop;
    let containerHeight = parentPosition.height;
    for (let i = 0; i < al; i++) {
        let currentDom = document.querySelector(`.PDF-container [data-query-index="${arr[i]}"]`);
        if (currentDom) {
            let prevStyle = currentDom.getAttribute('style');
            let newStyle = prevStyle + `background:#ec417a;color:#fff;`
            currentDom.setAttribute("style", newStyle);
            if (i == 0 && syncPDF) {
                let currentTop = currentDom.getBoundingClientRect().top;
                let newTop = parentScrollTop;
                if (currentTop < 0) {
                    newTop = parentScrollTop - parentTop - Math.abs(currentTop) - containerHeight / 2;
                } else if (currentTop > 0 && currentTop < parentTop) {
                    newTop = parentScrollTop - parentTop + currentTop - containerHeight / 2;
                } else if (currentTop > parentTop + containerHeight) {
                    newTop = parentScrollTop - parentTop + currentTop + containerHeight / 2;
                } else {
                }

                parent.scrollTo({
                    top: newTop,
                    left: 0,
                    // behavior: "smooth",
                });
            }
        }
    }
}

const removeHighlightingCorrespondingTexts = (arr) => {
    let al = arr.length;
    for (let i = 0; i < al; i++) {
        let prevDom = document.querySelector(`.PDF-container [data-query-index="${arr[i]}"]`);
        if (prevDom) {
            let prevStyle = prevDom.getAttribute('style');
            let removeIndex = prevStyle.indexOf("background:");
            let newStyle = prevStyle.substring(0, removeIndex);
            prevDom.setAttribute("style", newStyle)
        }
    }
}

export {
    handlePDFHightLight,
    getLanguageSample,
    collectQuery,
    parseQueryStr,
    highlightingCorrespondingTexts,
    removeHighlightingCorrespondingTexts
}