import { useEffect, useState } from "react"
import { getDocuments } from "../services/api"
import DocumentCard from "../components/DocumentCard"
import { FileText } from "lucide-react"
import "./Dashboard.css"


function Dashboard() {

    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getDocuments().then(data => {
            setDocs(data.documents)
        }).finally(() => {
            setLoading(false)
        })
    }, [])

    return (
        <div className="dash-page">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={24} /> Available Documents
            </h2>

            {loading ? (
                <div className="dash-skeleton-wrap" role="status" aria-live="polite" aria-label="Loading documents">
                    <div className="app-skeleton dash-skeleton-card" />
                    <div className="app-skeleton dash-skeleton-card" />
                    <div className="app-skeleton dash-skeleton-card" />
                </div>
            ) : (
                docs.map((doc, index) => (
                    <DocumentCard key={index} doc={doc} />
                ))
            )}

        </div>
    )
}

export default Dashboard