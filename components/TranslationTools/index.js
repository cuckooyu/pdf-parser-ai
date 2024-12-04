import React, { useCallback, useState } from 'react';
import { Tooltip } from 'antd';
import './index.scss';
function TranslationTools({ setScale, scale, syncPDF, setSyncPDF }) {
    // Increase font size
    const increaseSize = () => {
        if (scale >= 10 && scale < 20) {
            setScale(prev => prev + 1);
        }
    }

    // Reduce font size
    const reduceSize = () => {
        if (scale > 10 && scale <= 20) {
            setScale(prev => prev - 1);
        }
    }
    return (
        <div className='translation-tools'>
            <i className="iconfont icon-zoom-in" title="Increase font size" onClick={increaseSize}></i>
            <i className="iconfont icon-zoom-out" title="Reduce font size" onClick={reduceSize}></i>
            <Tooltip title={'Synchronize the location in the PDF'}>
            <i className={syncPDF ? "iconfont icon-association sync-pdf" : "iconfont icon-association"} title="" onClick={() => setSyncPDF(!syncPDF)}></i>
            </Tooltip>
        </div>
    );
}

export {
    TranslationTools
}
