const API_URL = "http://127.0.0.1:5000"

export const getDocuments = async () => {
    const res = await fetch(`${API_URL}/documents`)
    return res.json()
}

export const addUser = async (user) => {
    const res = await fetch(`${API_URL}/add-user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    })
    return res.json()
}