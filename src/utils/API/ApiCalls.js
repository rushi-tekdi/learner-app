import EndUrls from './EndUrls';
import axios from 'axios';

export const getAccessToken = async () => {
  const url = EndUrls.login;
  let data = JSON.stringify({
    username: 'test1',
    password: '12345',
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: url,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    data: data,
  };

  let api_response = null;

  await axios
    .request(config)
    .then((response) => {
      if (response?.data?.result?.access_token) {
        //console.log(response?.data?.result?.access_token);
        api_response = response.data.result.access_token;
      }
    })
    .catch((error) => {
      //console.log(error);
    });
  return api_response;
};

//read content
export const readContent = async (content_do_id) => {
  const url =
    EndUrls.read_content +
    content_do_id +
    `?fields=transcripts,ageGroup,appIcon,artifactUrl,downloadUrl,attributions,attributions,audience,author,badgeAssertions,board,body,channel,code,concepts,contentCredits,contentType,contributors,copyright,copyrightYear,createdBy,createdOn,creator,creators,description,displayScore,domain,editorState,flagReasons,flaggedBy,flags,framework,gradeLevel,identifier,itemSetPreviewUrl,keywords,language,languageCode,lastUpdatedOn,license,mediaType,medium,mimeType,name,originData,osId,owner,pkgVersion,publisher,questions,resourceType,scoreDisplayConfig,status,streamingUrl,subject,template,templateId,totalQuestions,totalScore,versionKey,visibility,year,primaryCategory,additionalCategories,interceptionPoints,interceptionType&orgdetails=orgName,email&licenseDetails=name,description,url`;

  let api_response = null;

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: url,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
  };

  await axios
    .request(config)
    .then((response) => {
      //console.log(JSON.stringify(response.data));
      api_response = response.data;
    })
    .catch((error) => {
      console.log(error);
    });

  return api_response;
};

//hierarchy content
export const hierarchyContent = async (content_do_id) => {
  const url = EndUrls.hierarchy_content + content_do_id;

  let api_response = null;

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: url,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
  };

  await axios
    .request(config)
    .then((response) => {
      //console.log(JSON.stringify(response.data));
      api_response = response.data;
    })
    .catch((error) => {
      console.log(error);
    });

  return api_response;
};

//list question
export const listQuestion = async (url, identifiers) => {
  let data = JSON.stringify({
    request: {
      search: {
        identifier: identifiers,
      },
    },
  });

  let api_response = null;

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: url,
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Content-Type': 'application/json',
      Connection: 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    },
    data: data,
  };

  await axios
    .request(config)
    .then((response) => {
      //console.log(JSON.stringify(response.data));
      api_response = response.data;
    })
    .catch((error) => {
      console.log(error);
    });

  return api_response;
};
