function DocumentCard({ doc }) {
    return (
        <div style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "10px",
            borderRadius: "8px"
        }}>
            <h3>{doc.title}</h3>
            <p>Subject: {doc.subject}</p>
        </div>
    )
}

export default DocumentCard