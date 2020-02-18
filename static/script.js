$(() => {
  $('#register').on('submit', async (e) => {
    e.preventDefault();

    let response = await $.ajax({
      method: 'POST',
      url: '/auth/register',
      data: $('#register').serialize()
    });

    if(response.token) {
      localStorage.setItem("_token", response.token);
    }

    window.location.href = "/"
  });
});