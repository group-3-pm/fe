// Hàm đếm số phần tử chỉ chứa dấu '-'
function countDashOnlySections(text) {
	const parts = text.split('|');
	let dashOnlyCount = 0;
	
	// Đếm các phần tử chỉ chứa dấu '-'
	for (let part of parts) {
		const trimmed = part.trim();
		if (/^[-]+$/.test(trimmed)) {
			dashOnlyCount++;
		}
	}
	
	return dashOnlyCount;
}

// Hàm xử lý bảng và nhóm các phần tử theo cột, sau đó thêm \n sau mỗi hàng
export function processTable(inputText) {
	const dashOnlyCount = countDashOnlySections(inputText);
	
	// Tách chuỗi thành các phần tử bằng dấu '|'
	const parts = inputText.split('|');
	
	// Xử lý các nhóm cột và thêm \n sau mỗi hàng
	let result = [];
	let row = [];
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i].trim();
		
		// Thêm phần tử vào hàng hiện tại
		row.push(part);
		
		// Khi đạt đến phần tử cuối cùng của một cột (dựa vào số cột), thêm | và \n vào hàng
		if ((i + 1) % (dashOnlyCount + 1) === 0) {
			result.push(row.join('|') + '|\n');  // Thêm dấu '|' ở cuối và \n
			row = []; // Xóa hàng đã xử lý
		}
	}
	
	// Ghép tất cả các dòng lại thành chuỗi
	return result.join('');
}

export function processText(input) {
	// Split the input by newline characters to handle each line
	const rows = input.split('\n');
	
	// Process each row, ensuring that we preserve line breaks within a cell between `|` characters
	const processedRows = rows.map(row => {
		return row.split('|').map(cell => {
			// Replace newline characters within cells with a space
			return cell.replace(/\n/g, ' ').trim();
		}).join(' | ');
	});
	
	// Join the processed rows back with newline characters between rows
	return processedRows.join('\n');
}


// Ví dụ sử dụng
export const inputText = `ĐỀ CƯƠNG CUỐI HỌC KÌ 1 TIN HỌC 8\\n\\n| # | # | # | # | # |\\n|---|---|---|---|---|\\n|Table 1|Teabl2|Tabl3|hdkakjajks|klajadskl|\\n|ádjhfhkjahjks|akldsflkkals|Nmbmn nm|J1903|8uidas|\\n|Xmcnmna|oapodsfp|jkanf|akljfkjl|Klajjsd|\\n|Mandfmnm|lkadsflkl|,mdfsm,ád|Lạ|902389|\\n|Ádmfm|Àdk|M,fmads|Iojasdioj|0-32i0-|\\n|Ma,fm|Akldsfkl|10989139294|Kl;kasl;|0-193|\\n\\n\\nPHẦN TRẮC NGHIỆM\\n\\nCâu 1. Địa chỉ tương đối có đặc điểm?\\n\\nA. Không thay đổi khi sao chép công thức nhưng vẫn giữ nguyên vị trí tương đối giữa ô chứa công thức và ô có địa chỉ trong công thức.\\n\\nB. Tự động thay đổi khi sao chép công thức nhưng vẫn giữ nguyên vị trí tương đối giữa ô chứa công thức và ô có địa chỉ trong công thức.\\n\\nC. Tự động thay đổi khi sao chép công thức nhưng không giữ nguyên vị trí tương đối giữa ô chứa công thức và ô có địa chỉ trong công thức.\\n\\nD. Tự động thay đổi khi sao chép công thức nhưng không giữ nguyên vị trí tương đối giữa ô chứa công thức và ô có địa chỉ trong công thức.\\n\\nCâu 2. Kí hiệu nào sau đây được dùng để chỉ định địa chỉ tuyệt đối trong công thức?\\n\\nA. #.            `;

export const markdown = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Row 1, Cell 1 | Row 1, Cell 2 | Row 1, Cell 3 |
| Row 2, Cell 1 | Row 2, Cell 2 | Row 2, Cell 3 |
`;
console.log(processTable(inputText));
