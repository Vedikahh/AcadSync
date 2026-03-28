import { useEffect, useState } from "react"
import { getDocuments } from "../services/api"
import DocumentCard from "../components/DocumentCard"
import { FileText } from "lucide-react"


function Dashboard() {

    const [docs, setDocs] = useState([])

    useEffect(() => {
        getDocuments().then(data => {
            setDocs(data.documents)
        })
    }, [])

    return (
        <div style={{ padding: "20px" }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={24} /> Available Documents
            </h2>

            {docs.map((doc, index) => (
                <DocumentCard key={index} doc={doc} />
            ))}

        </div>
    )
}

export default Dashboard