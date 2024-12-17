import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import Markdown from "react-markdown";
import "./index.css"
import { Simulate } from "react-dom/test-utils";
import progress = Simulate.progress;

export default function App() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [conversionFormat, setConversionFormat] = useState('json');
	const [conversionResult, setConversionResult] = useState([]);
	const websocketRef = useRef<WebSocket | null>(null);
	const [resultPage, setResultPage] = useState (0);
	const [documentId, setDocumentId] = useState (0)
	
	const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			setSelectedFile(event.target.files[0]);
		}
	};
	
	const handleFormatChange = (event: ChangeEvent<HTMLInputElement>) => {
		setConversionFormat(event.target.value);
	};
	
	const handleConvert = async() => {
		if (selectedFile) {
			const formData = new FormData();
			formData.append('file', selectedFile);
			try {
				const response = await fetch('http://localhost:8081/e/pdf', {
					method: 'POST',
					body: formData,
				});

				if (!response.ok) {
					throw new Error('Failed to upload file');
				}

				const result = await response.json();
				setDocumentId(result.id || 0);
				const resultArray = [];
				result?.data?.forEach(page => {
					const imageList = page?.page?.images;
					const tables = page?.page?.tables; // Danh sách bảng
					let convertedText = page?.page?.text;
					console.log(tables)
					
					// Xử lý bảng
					tables?.forEach((table, tableIndex) => {
						console.log(table)
						const tableRows = table?.content?.split("\n"); // Tách từng hàng trong bảng
						const markdownTable = [];

						tableRows.forEach((row, rowIndex) => {
							const columns = row.split(","); // Tách các cột trong hàng
							const markdownRow = columns.map((col) => col.trim()).join(" | "); // Ghép cột với ký tự `|`
							markdownTable.push(`| ${markdownRow} |`); // Thêm dấu `|` vào đầu và cuối
							if (rowIndex === 0) {
								// Thêm hàng phân cách (chỉ cần sau tiêu đề)
								markdownTable.push(
									`| ${columns.map(() => "--------------------").join(" | ")} |`
								);
							}
						});

						// Ghép bảng Markdown
						const tableMarkdown = markdownTable.join("\n");

						// Tìm và thay thế nội dung trong text với bảng Markdown
						convertedText = convertedText.replace(
							`{table${tableIndex}}`, // Ví dụ: Sử dụng {table0} để đánh dấu vị trí bảng trong text
							tableMarkdown
						);
					});
					
					imageList?.forEach(image => {
						const imageSrc = image?.content;
						const imageName = image?.name;
						convertedText = page.page.text.replace(`(${imageName})`, `(data:image/png;base64,${imageSrc})`);
					});
					resultArray.push(convertedText);
					setConversionResult(resultArray);
				});
			} catch (error) {
				console.error('Error uploading file:', error);
			}
		}
	};
	
	const handleGetGeminiRequestByDocumentId = async () => {
		try {
			const response = await fetch(`http://localhost:8081/e/gemini/image/${documentId}`);
			
			const result = await response.json();
			console.log(result)
			
			try {
				const summarizeResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCCvI2GTCP8nQRnWMLdkrsyBAaBcu9uH9U`, {
					method: 'POST',
					body: JSON.stringify(result)
				}) ;
				
				const summarizeResult = await summarizeResponse.json();
				console.log(summarizeResult)
			} catch (e) {
				console.error('Summarize failed: ', e)
			}
		} catch (e) {
			console.log('Get gemini request body failed');
		}
	}
	
	const containerStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: '100vh',
		backgroundColor: '#f3f4f6',
		width: 'fit-content'
	};
	
	const cardStyle: React.CSSProperties = {
		width: '100%',
		// maxWidth: '32rem',
		backgroundColor: 'white',
		borderRadius: '0.5rem',
		boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
	};
	
	const cardContentStyle: React.CSSProperties = {
		padding: '1.5rem',
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem',
		width: '1000px'
	};
	
	const buttonStyle: React.CSSProperties = {
		backgroundColor: '#3b82f6',
		color: 'white',
		padding: '0.5rem 1rem',
		borderRadius: '0.25rem',
		border: 'none',
		cursor: 'pointer',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: 'fit-content',
		fontSize: '0.875rem',
		fontWeight: 'medium',
	};
	
	const disabledButtonStyle: React.CSSProperties = {
		...buttonStyle,
		backgroundColor: '#9ca3af',
		cursor: 'not-allowed',
	};
	
	const textareaStyle: React.CSSProperties = {
		width: '100%',
		height: '200px',
		padding: '0.5rem',
		borderRadius: '0.25rem',
		border: '1px solid #d1d5db',
		marginTop: '0.5rem',
	};
	
	return (
		<div style={containerStyle}>
			<div style={cardStyle}>
				<div style={cardContentStyle}>
					<div>
						<label htmlFor="file">Upload File</label>
						<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
							<input
								id="file"
								type="file"
								accept=".pdf,.doc,.docx"
								onChange={handleFileSelect}
								style={{ display: 'none' }}
							/>
							<button
								onClick={() => document.getElementById('file')?.click()}
								style={buttonStyle}
							>
								Choose File
							</button>
							<span>{selectedFile ? selectedFile.name : 'No file chosen'}</span>
						</div>
					</div>
					{/*<div>*/}
					{/*	<p>Conversion Format</p>*/}
					{/*	<div style={{ display: 'flex', gap: '1rem' }}>*/}
					{/*		<label>*/}
					{/*			<input*/}
					{/*				type="radio"*/}
					{/*				value="json"*/}
					{/*				checked={conversionFormat === 'json'}*/}
					{/*				onChange={handleFormatChange}*/}
					{/*			/>*/}
					{/*			JSON*/}
					{/*		</label>*/}
					{/*		<label>*/}
					{/*			<input*/}
					{/*				type="radio"*/}
					{/*				value="markdown"*/}
					{/*				checked={conversionFormat === 'markdown'}*/}
					{/*				onChange={handleFormatChange}*/}
					{/*			/>*/}
					{/*			Markdown*/}
					{/*		</label>*/}
					{/*		</label>*/}
					{/*	</div>*/}
					{/*</div>*/}
					<div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
						<button
							onClick={handleConvert}
							disabled={!selectedFile}
							style={selectedFile ? buttonStyle : disabledButtonStyle}
						>
							Convert
						</button>
					</div>
					
					<div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
						<button
							onClick={handleGetGeminiRequestByDocumentId}
							disabled={!selectedFile}
							style={selectedFile ? buttonStyle : disabledButtonStyle}
						>
							Summarize
						</button>
					</div>
					
					{conversionResult.length > 0 && (
						<>
							<div>
								<label htmlFor="result">Conversion Result</label>
								<Markdown urlTransform={(value: string) => value}>{conversionResult[resultPage]}</Markdown>
							</div>
							<div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
								{conversionResult?.map((result, index) => (
									<div key={index} className={'page-number'} style={{cursor: "pointer", width: "25px", height: "25px", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: index === resultPage ? 'gray' : '', margin: '5px', borderRadius: "4px"}} onClick={() => {
										setResultPage(index)
									}}>{index + 1}</div>
								))}
							</div>
						</>
						
					)}
					
				</div>
			</div>
		</div>
	);
}
