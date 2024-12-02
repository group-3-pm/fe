import React, { useState, ChangeEvent, useEffect, useRef } from 'react';

export default function App() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [conversionFormat, setConversionFormat] = useState('json');
	const [conversionResult, setConversionResult] = useState('');
	const websocketRef = useRef<WebSocket | null>(null);
	
	const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			setSelectedFile(event.target.files[0]);
		}
	};
	
	const handleFormatChange = (event: ChangeEvent<HTMLInputElement>) => {
		setConversionFormat(event.target.value);
	};
	
	const handleConvert = () => {
		if (selectedFile && websocketRef.current) {
			const reader = new FileReader();
			
			reader.onload = () => {
				const fileBuffer = reader.result as ArrayBuffer;
				
				const message = {
					format: conversionFormat,
					fileName: selectedFile.name,
					fileData: fileBuffer,
				};
				
				websocketRef.current?.send(message);
				setConversionResult(`Converting ${selectedFile.name} to ${conversionFormat.toUpperCase()}`);
			};
			
			reader.readAsArrayBuffer(selectedFile);
		}
	};
	
	useEffect(() => {
		const ws = new WebSocket('ws://localhost:8080');
		websocketRef.current = ws;
		
		ws.onopen = () => {
			console.log('WebSocket connected');
		};
		
		ws.onmessage = (event) => {
			console.log('Message received:', event.data);
			setConversionResult(event.data);
		};
		
		ws.onclose = () => {
			console.log('WebSocket disconnected');
		};
		
		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
		};
		
		return () => {
			ws.close();
		};
	}, []);
	
	const containerStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: '100vh',
		backgroundColor: '#f3f4f6',
	};
	
	const cardStyle: React.CSSProperties = {
		width: '100%',
		maxWidth: '32rem',
		backgroundColor: 'white',
		borderRadius: '0.5rem',
		boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
	};
	
	const cardContentStyle: React.CSSProperties = {
		padding: '1.5rem',
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem',
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
					<div>
						<p>Conversion Format</p>
						<div style={{ display: 'flex', gap: '1rem' }}>
							<label>
								<input
									type="radio"
									value="json"
									checked={conversionFormat === 'json'}
									onChange={handleFormatChange}
								/>
								JSON
							</label>
							<label>
								<input
									type="radio"
									value="markdown"
									checked={conversionFormat === 'markdown'}
									onChange={handleFormatChange}
								/>
								Markdown
							</label>
						</div>
					</div>
					<button
						onClick={handleConvert}
						disabled={!selectedFile}
						style={selectedFile ? buttonStyle : disabledButtonStyle}
					>
						Convert
					</button>
					<div>
						<label htmlFor="result">Conversion Result</label>
						<textarea
							id="result"
							value={conversionResult}
							readOnly
							style={textareaStyle}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
