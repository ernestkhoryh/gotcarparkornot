import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';

function SearchForm({ location, setLocation, onCheck, loading }) {
  return (
    <Form className="mb-3">
      <Form.Group as={Row} controlId="carparkSearch">
        <Form.Label column sm={4}>Enter Your Location Address Or Postal Code:</Form.Label>
        <Col sm={6}>
          <Form.Control
            type="text"
            value={location}
            placeholder="e.g. 2A Dover Road or 131002"
            onChange={(e) => setLocation(e.target.value)}
          />
        </Col>
        <Col sm={2}>
          <Button variant="primary" onClick={onCheck} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Check'}
          </Button>
        </Col>
      </Form.Group>
    </Form>
  );
}

export default SearchForm;
