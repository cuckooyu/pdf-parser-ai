import React, { useCallback, useState, useEffect, useRef } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Form, Radio, Button, message, notification } from 'antd';
import { showSummarizeAtom } from "../PDFMenu";
import './index.scss';
import { concatStr, concatSummarizeArr } from "../../utils";
import { summarizerArticleAtom } from "../PDFMenu";
import { totalTextsAtom } from "../PDFContainer";
import { selectedPDFAtom, toggleLeftAtom } from "../LeftPanel";

const formItemLayout = {
    labelCol: {
        span: 6,
    },
    wrapperCol: {
        span: 16,
    },
};

const options1 = [
    {
        label: 'key-points',
        value: 'key-points',
    },
    {
        label: 'tl;dr',
        value: 'tl;dr',
    },
    {
        label: 'teaser',
        value: 'teaser',
    },
    {
        label: 'headline',
        value: 'headline',
    },
];

const options2 = [
    {
        label: 'markdown',
        value: 'markdown',
    },
    {
        label: 'plain-text',
        value: 'plain-text',
    },
];

const options3 = [
    {
        label: 'short',
        value: 'short',
    },
    {
        label: 'medium',
        value: 'medium',
    },
    {
        label: 'long',
        value: 'long',
    },
];

const options = {
    sharedContext: '',
    type: 'tl;dr',
    format: 'markdown',
    length: 'long',
};

const summarizeNowAtom = atom(false);
const summarizeCompleteAtom = atom(false);
const summarizeStoreAtom = atom({});

function SummarizeContainer() {
    const [form] = Form.useForm();
    const summarizeContainerRef = useRef(null);
    const selectPDF = useAtomValue(selectedPDFAtom);
    const [summarizeStore, setSummarizeStore] = useAtom(summarizeStoreAtom);
    const summarizerArticleValue = useAtomValue(summarizerArticleAtom);//true/false
    const totalTexts = useAtomValue(totalTextsAtom);//[]
    const summarizeArrRef = useRef("");
    const [loading, setLoading] = useState(false);
    const currentPDFRef = useRef(null);

    useEffect(() => {
        if (summarizerArticleValue) {
            if (totalTexts.length) {
                let summarizeArr = concatSummarizeArr(totalTexts);
                summarizeArrRef.current = summarizeArr;
                summarizerArticles(summarizeArr, options);
            }
        }
    }, [summarizerArticleValue])

    // when change pdf file
    useEffect(() => {
        if (summarizeContainerRef.current) {
            summarizeContainerRef.current.innerHTML = "";
        }
        currentPDFRef.current = selectPDF;
        if (summarizeStore[selectPDF.key]) {
            renderSummarizeResult(summarizeStore[selectPDF.key]);
        }
    }, [selectPDF])

    const renderSummarizeResult = (arr) => {
        let al = arr.length;
        if (!al) return;
        creatPre(al);
        for (let i = 0; i < al; i++) {
            let indexStr = `pre-${i}`;
            let target = document.querySelector(`[data-pre-index='${indexStr}']`);
            if (target) {
                target.innerText = arr[i];
            }
        }
    }

    const summarizerUnit = async (string, config, index, pdfInfo) => {
        const available = (await self.ai.summarizer.capabilities()).available;
        let summarizer;
        if (available === 'no') {
            // The Summarizer API isn't usable.
            return;
        }
        if (available === 'readily') {
            // The Summarizer API can be used immediately .
            summarizer = await self.ai.summarizer.create(config);
        } else {
            // The Summarizer API can be used after the model is downloaded.
            summarizer = await self.ai.summarizer.create(config);
            summarizer.addEventListener('downloadprogress', (e) => {
                console.log(e.loaded, e.total);
            });
            await summarizer.ready;
        }
        const summary = await summarizer.summarize(string, {
            context: '',
        });
        let tmp = { ...summarizeStore };
        if (tmp[pdfInfo.key]) {
            tmp[pdfInfo.key] = [
                ...tmp[pdfInfo.key],
                summary
            ]
        } else {
            tmp[pdfInfo.key] = [];
            tmp[pdfInfo.key].push(summary);
        }

        setSummarizeStore(tmp);
        let indexStr = `pre-${index}`;
        if (pdfInfo.key == currentPDFRef.current.key) {
            let target = document.querySelector(`[data-pre-index='${indexStr}']`);
            if (target) {
                target.innerText = summary;
            }
        }
    }

    const creatPre = (length) => {
        for (let i = 0; i < length; i++) {
            let preWrap = document.createElement('pre');
            preWrap.setAttribute("data-pre-index", `pre-${i}`);
            summarizeContainerRef.current.appendChild(preWrap);
        }
    }

    const summarizerArticles = async (arr, options, pdfInfo) => {
        let al = arr.length;
        if (!al) return;
        if (summarizeContainerRef.current) {
            summarizeContainerRef.current.innerHTML = "";
        }
        let summarizeArr = concatSummarizeArr(arr);
        let sAL = summarizeArr.length;
        creatPre(sAL);
        for (let i = 0; i < sAL; i++) {
            await summarizerUnit(summarizeArr[i], options, i, pdfInfo);
        }
        setLoading(false);
        if (pdfInfo.key !== currentPDFRef.current.key) {
            notification.success({
                message: `Summary is over`,
                description:
                    `Go to ${pdfInfo.title} to check the results.`,
            });
        }
    }

    const submit = () => {
        let formValues = form.getFieldsValue();
        let tmp = {
            ...formValues,
            sharedContext: '',
        }
        if (summarizeContainerRef.current) {
            summarizeContainerRef.current.innerHTML = "";
        }

        let pl = totalTexts.length;
        creatPre(pl);
        setLoading(true);
        summarizerArticles(totalTexts, tmp, selectPDF);
    }

    return (
        <div className='summarize-container'>
            <h2>Summarize</h2>
            <h5>Configuration</h5>
            <div className='configuration-container'>
                <Form
                    name="basic"
                    className='summarize-configuration-form'
                    form={form}
                    {...formItemLayout}
                    initialValues={{
                        "type": 'key-points',
                        "format": 'markdown',
                        "length": 'medium',
                    }}
                >
                    <Form.Item
                        name="type"
                        label="Summary Type"
                        hasFeedback
                    >
                        <Radio.Group
                            block
                            size="small"
                            options={options1}
                            optionType="button"
                            buttonStyle="solid"
                        />
                    </Form.Item>
                    <Form.Item
                        name="length"
                        label="Length"
                        hasFeedback
                    >
                        <Radio.Group
                            block
                            size="small"
                            options={options3}
                            optionType="button"
                            buttonStyle="solid"
                        />
                    </Form.Item>
                    <Form.Item
                        name="format"
                        label="Format"
                        hasFeedback
                    >
                        <Radio.Group
                            block
                            size="small"
                            options={options2}
                            optionType="button"
                            buttonStyle="solid"
                        />
                    </Form.Item>
                </Form>

                <Button type="primary" onClick={submit} loading={loading} iconPosition="start">Generate</Button>
            </div>

            <h5>Summary</h5>
            <div className='summarize-content' ref={summarizeContainerRef}>

            </div>
        </div>
    );
}

export {
    SummarizeContainer,
    summarizeNowAtom,
    summarizeCompleteAtom,
}
