import { gql } from "@apollo/client";

// Define the working GraphQL query for company employees
export const FETCH_COMPANY_EMPLOYEE_QUERY = gql`
  query FetchCompanyEmployee($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchCompanyEmployee(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      employeeID
      firstName
      lastName
      gender
      aadharNumber
      emailID
      isDeleted
      createdOn
      createdBy
    }
  }
`;