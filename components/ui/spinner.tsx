import './spinner.css';

export default function Spinner() {
  return (
    <svg className="cus-spinner" viewBox="0 0 50 50">
      <circle className="cus-spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
    </svg>
  );
}
