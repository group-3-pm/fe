import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import Markdown from "react-markdown";
import "./index.scss"
import { Simulate } from "react-dom/test-utils";
import { CircularProgress } from "@mui/material";
import { inputText, markdown, processTable, processText } from "./utils/processTableText.ts";
import remarkGfm from "remark-gfm";

export default function App () {
	const [selectedFile, setSelectedFile] = useState<File | null> (null);
	const [conversionFormat, setConversionFormat] = useState ('json');
	const [conversionResult, setConversionResult] = useState ([]);
	const websocketRef = useRef<WebSocket | null> (null);
	const [resultPage, setResultPage] = useState (0);
	const [documentId, setDocumentId] = useState (0);
	const [loadingState, setLoadingState] = useState<"idle" | "converting" | "summarizing"> ("idle");
	const [summarizeResult, setSummarizeResult] = useState ('')
	
	const handleFileSelect = ( event: ChangeEvent<HTMLInputElement> ) => {
		if (event.target.files && event.target.files[0]) {
			setSelectedFile (event.target.files[0]);
		}
	};
	
	const handleFormatChange = ( event: ChangeEvent<HTMLInputElement> ) => {
		setConversionFormat (event.target.value);
	};
	
	function convertImgToMarkdown ( xmlString ) {
		// Sử dụng RegExp để tìm tất cả các thẻ <img> với thuộc tính src
		const imgTagRegex = /<img src="(data:image\/\w+;base64,[^"]+)"[^>]*>/g;
		
		// Thay thế tất cả các thẻ <img> bằng cú pháp markdown
		return xmlString.replaceAll (imgTagRegex, ( match, src ) => {
			// Tạo cú pháp markdown cho hình ảnh
			return `![image](${src})`;
		});
	}
	
	const handleProcess = () => {
		handleConvert ().then (( resolve: number ) => setTimeout (() => {
			console.log (resolve)
			handleGetGeminiRequestByDocumentId (resolve)
		}, 0))
	}
	
	const handleConvert = async () => {
		setSummarizeResult ('');
		setConversionResult ([]);
		
		if (selectedFile) {
			setLoadingState ("converting");
			console.log (selectedFile)
			const formData = new FormData ();
			formData.append ('file', selectedFile);
			try {
				const response = await fetch ('http://densach.edu.vn/api/e/pdf', {
					method: 'POST',
					body: formData,
				});
				
				if (!response.ok) {
					throw new Error ('Failed to upload file');
				}
				
				const result = await response.json ();
				setDocumentId (result.id || 0);
				const resultArray = [];
				result?.data?.forEach (page => {
					const imageList = page?.page?.images;
					const tables = page?.page?.tables; // Danh sách bảng
					let convertedText = page?.page?.text;
					console.log (tables)
					
					imageList?.forEach (image => {
						const imageSrc = image?.content;
						const imageName = image?.name;
						
						if (selectedFile?.type?.includes ('pdf')) {
							convertedText = page.page.text.replace (`(${imageName})`, `(data:image/png;base64,${imageSrc})`);
						}
						if (selectedFile?.type?.includes ('doc')) {
							console.log (page.page.text.includes (`media/${imageName}`), ' ', `media/(${imageName})`)
							convertedText = convertedText.replace (`media/${imageName}`, `data:image/png;base64,${imageSrc}`);
						}
					});
					resultArray.push (convertImgToMarkdown (convertedText));
					setConversionResult (resultArray);
				});
				
				return result.id || 0;
				// handleGetGeminiRequestByDocumentId();
			} catch (error) {
				console.error ('Error uploading file:', error);
				setLoadingState ("idle");
			}
		}
	};
	
	const processValidArray = ( array: any[] ) => {
		return array.map (element => {
			if(element !== {}) return element;
		});
	}
	
	const handleGetGeminiRequestByDocumentId = async ( documentId: number ) => {
		setLoadingState ("summarizing");
		// if (!documentId) return;
		
		try {
			const imageResponse = await fetch (`http://densach.edu.vn/api/e/gemini/image/${documentId}`);
			const tableResponse = await fetch (`http://densach.edu.vn/api/e/gemini/${documentId}`);
			
			const imageResult = await imageResponse.json ();
			const tableResult = await tableResponse.json ();
			
			const imagePrompt = imageResult.contents?.[0]?.parts;
			const tablePrompt = tableResult.contents?.[0]?.parts;
			const prompt = [...(imagePrompt.length > 1 ? processValidArray (imagePrompt) : []), ...(tablePrompt.length > 1 ? processValidArray (tablePrompt) : [])];
			console.log ({ imagePrompt, tablePrompt, prompt });
			
			const requestBody = {
				contents: [
					{
						parts: prompt
					}
				]
			}
			
			console.log ('check: ', requestBody);
			
			try {
				if (!prompt.length) return;
				
				const summarizeResponse = await fetch (`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCCvI2GTCP8nQRnWMLdkrsyBAaBcu9uH9U`, {
					method: 'POST',
					body: JSON.stringify (requestBody)
				});
				
				const summarizeResult = await summarizeResponse.json ();
				setSummarizeResult (summarizeResult?.candidates?.[0]?.content?.parts?.[0]?.text || '')
				console.log (summarizeResult?.candidates?.[0]?.content?.parts?.[0]?.text)
			} catch (e) {
				console.error ('Summarize failed: ', e);
				setLoadingState ("idle");
			}
		} catch (e) {
			console.log ('Get gemini request body failed', e);
			setLoadingState ("idle");
		} finally {
			setLoadingState ("idle");
		}
	}
	
	return (
		<div className="container">
			<div className="card">
				<div className="card-content">
					{/* File Upload Section */}
					<div className="file-upload">
						<label htmlFor="file">Upload File</label>
						<div className="file-input-wrapper">
							<input
								id="file"
								type="file"
								accept=".pdf,.doc,.docx"
								onChange={handleFileSelect}
								style={{ display: "none" }}
							/>
							<button
								className={`file-button`}
								onClick={() => document.getElementById ("file")?.click ()}
								// disabled={!selectedFile}
							>
								Choose File
							</button>
							<span className="file-name">
                {selectedFile ? selectedFile.name : "No file chosen"}
              </span>
						</div>
						<div className={'note'}>*Only choose docx or pdf file</div>
					</div>
					
					{/* Action Buttons */}
					<div className="action-buttons">
						<button
							className={`convert-button ${(!selectedFile || loadingState !== 'idle') ? "disabled" : ""}`}
							onClick={handleProcess}
							disabled={!selectedFile || loadingState !== 'idle'}
						>
							{loadingState === "idle" && (
								<div className="loading-state">Convert</div>
							)}
							
							{loadingState === "converting" && (
								<div className="loading-state">Converting...</div>
							)}
							
							{loadingState === "summarizing" && (
								<div className="loading-state">Summarizing...</div>
							)}
						</button>
					</div>
					{/*{conversionResult.length > 0 && (*/}
					{/*	<div className="action-buttons">*/}
					{/*		<button*/}
					{/*			className={`summarize-button ${!selectedFile ? "disabled" : ""}`}*/}
					{/*			onClick={handleGetGeminiRequestByDocumentId}*/}
					{/*		>*/}
					{/*			Summarize*/}
					{/*		</button>*/}
					{/*	</div>*/}
					{/*)}*/}
					
					<div className={'result'}>
						{loadingState === 'converting' && (
							<CircularProgress/>
						)}
						
						{loadingState !== 'converting' && (
							<>
								{conversionResult.length > 0 && (
									<div className="conversion-result" style={{ 'flex': 1 }}>
										<label htmlFor="result">Conversion Result</label>
										<div className="markdown-output">
											<Markdown remarkPlugins={[remarkGfm]} urlTransform={( value ) => value} className="foo">
												{processText (conversionResult[resultPage])}
												{/*{processText(inputText)}*/}
											</Markdown>
										</div>
										<div className="pagination">
											{conversionResult.map (( _, index ) => (
												<>
													{index !== conversionResult.length - 1 && (
														<div
															key={index}
															className={`page-number ${
																index === resultPage ? "active" : ""
															}`}
															onClick={() => setResultPage (index)}
														>
															{index + 1}
														</div>
													)}
												</>
											
											))}
										</div>
									</div>
								)}
								
								{summarizeResult && (
									<div className="conversion-result" style={{
										maxWidth: '900px'
									}}>
										<label htmlFor="result">Summarization Result</label>
										<div className="markdown-output">
											<Markdown urlTransform={( value ) => value}>
												{summarizeResult}
											</Markdown>
										</div>
									</div>
								)}
							</>
						)}
					
					</div>
					
					
					{/*<Markdown remarkPlugins={[remarkGfm]} urlTransform={(value) => value} className="foo">*/}
					{/*	{markdown}*/}
					{/*	*/}
					{/*	*/}
					{/*</Markdown>*/}
				
				</div>
			</div>
		</div>
	
	);
}
