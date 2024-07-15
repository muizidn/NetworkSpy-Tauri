export const LeftSidebar = () => (
    <div className="w-1/5 bg-gray-100 p-4">
      <h2 className="font-bold">Favorites</h2>
      <ul>
        <li>Pinned</li>
        <li>Saved</li>
      </ul>
      <h2 className="font-bold mt-4">All</h2>
      <ul>
        <li>
          <details>
            <summary>Apps</summary>
            <ul>
              <li>App 1</li>
              <li>App 2</li>
            </ul>
          </details>
        </li>
        <li>
          <details>
            <summary>Domains</summary>
            <ul>
              <li>Domain 1</li>
              <li>Domain 2</li>
            </ul>
          </details>
        </li>
      </ul>
    </div>
  );
  