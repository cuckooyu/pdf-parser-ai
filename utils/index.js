const concatStr = (arr) => {
    let result = "";
    for (let i = 0; i < arr.length; i++) {
        result += arr[i].str;
    }
    return result;
}

const concatSummarizeArr = (arr) => {
    let result = [];
    let al = arr.length;
    let currentStr = "";
    let currentLength = 0;
    for (let i = 0; i < al; i++) {
        if (currentLength < 3000) {
            currentStr += arr[i].str;
            currentLength += arr[i].length;
            if (i == al - 1) {
                let rl = result.length;
                result[rl - 1] += currentStr;
            }
        } else {
            result.push(currentStr);
            currentStr = arr[i].str;
            currentLength = arr[i].length;
        }
    }
    return result;
}

export {
    concatStr,
    concatSummarizeArr
}