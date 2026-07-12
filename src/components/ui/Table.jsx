import React from "react";

export default function Table({ headers = [], children, className = "" }) {
  return (
    <div className={`table-responsive ${className}`} style={{ width: '100%' }}>
      <table className="tbl" style={{ minWidth: 720 }}>
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}
