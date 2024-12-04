const getLastNode = (result) => {
    let resultLength = result.length;
    if (!resultLength) {
        return null;
    } else {
        return result[resultLength - 1];
    }
}

const splitNode = (obj, minLength, limitLength, maxLength, index) => {
    return [obj];

    if (obj.isPass && (obj.length > maxLength)) {
        let str = obj.str;
        let splitStrArr = str.split(/[/\s/，、,。.!?！？；;:：）]/),
            splitStrArrLength = splitStrArr.length;
        let result = [];
        for (let i = 0; i < splitStrArrLength; i++) {
            let current = splitStrArr[i];
            if (current == "") continue;
            let prev = getLastNode(result);
            if (prev && prev.length < minLength) {
                // 并入前一个
                prev.str += ` ${current}`;
                prev.length += current.length + 1;

            } else {
                result.push({
                    ...obj,
                    str: current,
                    length: current.length,
                    group: `group-${index}`
                })
            }
        }
        let lastOne = getLastNode(result);
        return result;
    } else {
        return [obj];
    }

}

const parseEnPDF = (arr, existPageNumber) => {
    let result = [];
    let minLength = 12;
    let maxLength = 35;
    let limitLength = 4;
    let endReg = new RegExp("[,.?!]");
    let prevFontHeight = null;
    const buildSinglePage = (singlePageArray, pageIndex) => {
        let arrLength = singlePageArray.length;
        const nodeType = {
            isBlank: "ISBLANK",
            startWithBreak: "STARTWITHBREAK",
            startNotWithBreak: "STARTNOTWITHBREAK",
            startWithBreakAndSingle: "STARTNOTWITHBREAKANDSINGLE",
        }

        const checkCurrentStatus = (string) => {
            let strLength = string.length;
            let isPass = (strLength >= minLength) && endReg.test(string.slice(-1));
            return isPass;
        }

        // 判断当前节点的类型
        const getNewNodeType = (string, stringLength) => {
            if (string.trim() === "") {
                return nodeType.isBlank;
            }
            let startWithBreak = endReg.test(string.slice(0, 1));

            if (startWithBreak) {
                if (stringLength == 1) {
                    return nodeType.startWithBreakAndSingle;
                } else {
                    return nodeType.startWithBreak;
                }
            } else {
                return nodeType.startNotWithBreak;;
            }
        }

        const pushQueryIndex = (prevNodeInResult, pageIndex, queryString) => {
            if (prevNodeInResult.page == pageIndex) {
                prevNodeInResult.queryIndex.push(queryString)
            } else {
                if (prevNodeInResult.nextPagesQuery) {
                    let target = prevNodeInResult.nextPagesQuery.find((item) => item.pageIndex == pageIndex);
                    if (target) {
                        target.queryIndex.push(queryString);
                    } else {
                        prevNodeInResult.nextPagesQuery.push({
                            pageIndex: pageIndex,
                            queryIndex: [queryString]
                        });
                    }
                } else {
                    // 没有，新建
                    if (prevNodeInResult.page !== pageIndex) {
                        prevNodeInResult.nextPagesQuery = [{
                            pageIndex: pageIndex,
                            queryIndex: [queryString]
                        }
                        ]
                    }
                }
            }
        }

        // 检查上一个节点
        const checkPrevResultNode = (prevNodeInResult, currentNodeInPage, isNewLine) => {
            if (!prevNodeInResult || prevNodeInResult.isPass) {
                return true;
            } else {
                if (isNewLine) {
                    // 当前是新标题，或者新段落，前一个节点必须完结
                    prevNodeInResult.isPass = true;
                    if (prevNodeInResult.length < limitLength) {
                        prevNodeInResult.str += "。。。。";
                        prevNodeInResult.length += 4;
                    }
                    return true;
                } else {
                    return false;
                }
            }
        }

        const getLastNodeInResult = () => {
            let resultLength = result.length;
            if (!resultLength) return null;
            let resultLastArrLength = result[resultLength - 1].length;
            if (!resultLastArrLength) return null;
            return result[resultLength - 1][resultLastArrLength - 1];
        }

        const checkLastNode = (index, lastIndex) => {
            if (index == lastIndex && pageIndex == arr.length - 1) {
                let lastOne = getLastNodeInResult();
                if (lastOne.length < limitLength) {
                    lastOne.str += "。。。。";
                    lastOne.length += 4;
                    lastOne.isPass = true;
                }
            }
        }
        const getIndex = (index) => {
            return existPageNumber ? index + 1 : index;
        }

        const handleCurrentNode = (index, lastIndex) => {
            let currentNodeInPage = singlePageArray[index];
            let currentString = currentNodeInPage.str,
                currentStringLength = currentString.length;
            if (currentString.trim() === "") return;
            let resultLastArrIndex = result.length == 0 ? null : result.length - 1;
            let prevNodeInResult = getLastNodeInResult();
            let isNewLine = false;
            if (currentNodeInPage.str !== " ") {
                if (!prevFontHeight) {
                    prevFontHeight = currentNodeInPage.height;
                } else {
                    if (prevFontHeight !== currentNodeInPage.height) {
                        isNewLine = true;
                        prevFontHeight = currentNodeInPage.height;
                    }
                }
            }
            if (checkPrevResultNode(prevNodeInResult, currentNodeInPage, isNewLine)) {
                // 检查上一个节点，返回的结果为true，表示上个节点完结，要开始新的节点
                let isPass = checkCurrentStatus(currentString);
                let current = {
                    str: currentString,
                    length: currentStringLength,
                    page: pageIndex,
                    height: currentNodeInPage.height,
                    isPass: isPass,
                    // style: currentStyle,
                    queryIndex: [`${pageIndex}-${getIndex(index)}`]
                }
                if (!prevNodeInResult || prevNodeInResult?.page !== pageIndex) {
                    result.push([current]);
                } else {
                    let resultLength = result.length,
                        lastResultArr = result[resultLength - 1];
                    lastResultArr.push(current);
                }
            } else {
                let prevNodeInResultPageIndex = prevNodeInResult.page;
                //返回的结果为false，表示当前节点必须合并到上一个节点或者依据判断结束上一个节点
                switch (getNewNodeType(currentString, currentStringLength)) {
                    case nodeType.isBlank: {
                        // 仅添加高亮关联，把该节点data-query-index值塞到上一个节点中
                        // pushQueryIndex(prevNodeInResult, pageIndex, `${pageIndex}-${getIndex(index)}`);
                        break;
                    }
                    case nodeType.startWithBreak: {
                        if (prevNodeInResult.length >= minLength) {
                            // 如果本节点开始有断点，且上一节点长度满足(同时上一节点结尾没断点)，则上一节点可以完结
                            prevNodeInResult.isPass = true;
                            let concatSymbol = currentString.substring(0, 1);
                            prevNodeInResult.str += concatSymbol;
                            prevNodeInResult.length += 1;
                            let newStr = currentString.substring(1, currentStringLength);
                            let isPass = checkCurrentStatus(currentString);
                            let current = {
                                str: newStr,
                                // style: currentStyle,
                                length: currentStringLength - 1,
                                height: currentNodeInPage.height,
                                queryIndex: [`${pageIndex}-${getIndex(index)}`],
                                page: pageIndex,
                                isPass: isPass,
                            };

                            if (prevNodeInResultPageIndex == pageIndex) {
                                // 在同一页内增加
                                let prevResult = splitNode(prevNodeInResult, minLength, limitLength, maxLength, index);
                                let tmp = splitNode(current, minLength, limitLength, maxLength);

                                result[resultLastArrIndex].pop();//先删掉旧的

                                result[resultLastArrIndex] = [
                                    ...result[resultLastArrIndex],
                                    ...prevResult,
                                    ...tmp
                                ]

                            } else {
                                // 新一页增加
                                let prevResult = splitNode(prevNodeInResult, minLength, limitLength, maxLength, index);
                                result[resultLastArrIndex].pop();//先删掉旧的
                                result[resultLastArrIndex] = [
                                    ...result[resultLastArrIndex],
                                    ...prevResult
                                ]
                                let tmp = splitNode(current, minLength, limitLength, maxLength, index);
                                result = [
                                    ...result,
                                    ...tmp
                                ]
                            }
                        } else {
                            //本节点长度不够，并入上一个节点
                            let newLength = prevNodeInResult.length + currentStringLength;
                            let newString = prevNodeInResult.str + currentString;
                            let isPass = checkCurrentStatus(newString);
                            prevNodeInResult.length = newLength;
                            prevNodeInResult.str = newString;
                            prevNodeInResult.isPass = isPass;

                            pushQueryIndex(prevNodeInResult, pageIndex, `${pageIndex}-${getIndex(index)}`);
                            let tmp = splitNode(prevNodeInResult, minLength, limitLength, maxLength, index);
                            result[resultLastArrIndex].pop();
                            result[prevNodeInResult.page] = [
                                ...result[prevNodeInResult.page],
                                ...tmp
                            ];
                        }
                        break;
                    }
                    case nodeType.startWithBreakAndSingle: {
                        prevNodeInResult.length += 1;
                        prevNodeInResult.str += currentString;
                        pushQueryIndex(prevNodeInResult, pageIndex, `${pageIndex}-${getIndex(index)}`);
                        if (prevNodeInResult.length + 1 >= minLength) {
                            // 如果上一个节点加上该断点正好满足最小长度，则上一节点完结
                            prevNodeInResult.isPass = true;
                            let tmp = splitNode(prevNodeInResult, minLength, limitLength, maxLength, index);
                            result[prevNodeInResult.page].pop();
                            result[prevNodeInResult.page] = [
                                ...result[prevNodeInResult.page],
                                ...tmp
                            ];
                        }
                        break;
                    }
                    case nodeType.startNotWithBreak: {
                        let newString = prevNodeInResult.str + " " + currentString;
                        let newLength = newString.length;
                        let isPass = checkCurrentStatus(newString);

                        prevNodeInResult.str = newString;
                        prevNodeInResult.length = newLength;
                        prevNodeInResult.isPass = isPass;
                        // prevNodeInResult.style = currentStyle;

                        pushQueryIndex(prevNodeInResult, pageIndex, `${pageIndex}-${getIndex(index)}`);
                        let tmp = splitNode(prevNodeInResult, minLength, limitLength, maxLength, index);
                        result[prevNodeInResult.page].pop();
                        result[prevNodeInResult.page] = [
                            ...result[prevNodeInResult.page],
                            ...tmp
                        ];
                        break;
                    }
                    default:
                        break;
                }
            }
            checkLastNode(index, lastIndex);
        }

        for (let i = 0; i < arrLength; i++) {
            handleCurrentNode(i, arrLength - 1);//传入arrLength - 1为了处理末尾最后一个节点
        }
    }

    arr.map((pageArr, index) => {
        if (pageArr.length !== 0) {
            buildSinglePage(pageArr, index);
        }
    })
    return concatArr(result);
}

const concatArr = (arr) => {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
        result = result.concat(arr[i]);
    }
    return result;
}

const setSinglePage = (arr, index) => {
    let tar = document.querySelectorAll(`[data-page-number="${index + 1}"] [role="presentation"]`)
    let indexCount = 0;
    for (let i = 0; i < tar.length; i++) {
        if (tar[i] !== '') {
            tar[i].setAttribute("data-query-index", `${index}-${indexCount}`);
            indexCount++;
        }
    }
}

const addDataAttribute = (arr) => {
    arr.map((item, index) => {
        setSinglePage(item, index);
    })
}

const concatNextPagesQuery = (arr) => {
    let result = [];
    for (let i = 0; i < arr.length; i++) {
        result = result.concat(arr[i].queryIndex);
    }
    return result;
}

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
        let tmp="";
        for(let i=0;i<al;i++){
            tmp +=obj.nextPagesQuery[i].queryIndex.join();
        }
        result += "," + tmp;
    }
    return result;
}

const parseQueryStr=(str)=>{
    if (!str) return;
    return str.split(",");
}

const highlightingCorrespondingTexts=(arr)=>{
    // 高亮新句子
    for (let i = 0; i < arr.length; i++) {
        let currentDom = document.querySelector(`[data-query-index="${arr[i]}"]`);
        if (currentDom) {
            let prevStyle = currentDom.getAttribute('style');
            let newStyle = prevStyle + `background:#ec417a;color:#fff;`
            currentDom.setAttribute("style", newStyle)
        }
    }
}

const removeHighlightingCorrespondingTexts=(arr)=>{
    for (let i = 0; i < arr.length; i++) {
        let prevDom = document.querySelector(`[data-query-index="${arr[i]}"]`);
        if (prevDom) {
            let prevStyle = prevDom.getAttribute('style');
            let removeIndex = prevStyle.indexOf("background:");
            let newStyle = prevStyle.substring(0, removeIndex);
            prevDom.setAttribute("style", newStyle)
        }
    }
}

export {
    addDataAttribute,
    parseEnPDF,
    handlePDFHightLight,
    getLanguageSample,
    collectQuery,
    parseQueryStr,
    highlightingCorrespondingTexts,
    removeHighlightingCorrespondingTexts
}