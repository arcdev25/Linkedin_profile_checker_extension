function UserFilter({ owners, selectedUserId, setSelectedUserId }) {
    return (
        <select
            className="select select-sm select-bordered"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
        >
            <option value="all">All Users</option>

            {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                    {owner.name}
                </option>
            ))}
        </select>
    )
}

export default UserFilter