const state = {
  currentUser: null,
  selectedUserType: null,
  selectedTransportType: null,
  selectedTier: null,
  users: [],
  donations: [],
  volunteerDonations: [],
  volunteerInstitutions: [],
  notifications: []
};

const bell = {
  list: [],
  unread: 0
};

// Definição dos planos por tipo de usuário
const PLANS = {
  doador: [
    { id: 'bronze', name: 'Bronze', price: 49.90, badge: 'Comece já' },
    { id: 'ouro', name: 'Ouro', price: 99.90, badge: 'Mais popular' },
    { id: 'diamante', name: 'Diamante', price: 199.90, badge: 'Premium' }
  ],
  recebedor: [
    { id: 'bronze', name: 'Bronze', price: 39.90, badge: 'Ideal para iniciar' },
    { id: 'ouro', name: 'Ouro', price: 89.90, badge: 'Recomendado' },
    { id: 'diamante', name: 'Diamante', price: 179.90, badge: 'Empresarial' }
  ],
  transportador: [
    { id: 'transportador', name: 'Transportador', price: 9.90, badge: 'Taxa única', isUnique: true }
  ]
};

// Taxas de frete por tipo de veículo (por km)
const FREIGHT_RATES = {
  moto: 7.90,
  carro: 9.90,
  caminhao: 12.90
};

const ECOLINK_COMMISSION = 0.20; // 20%

function loadFromLocalStorage() {
  const saved = localStorage.getItem('ecolinkData');
  if (saved) {
    const data = JSON.parse(saved);
    state.users = data.users || [];
    state.donations = data.donations || [];
    state.volunteerDonations = data.volunteerDonations || [];
    state.volunteerInstitutions = data.volunteerInstitutions || [];
  }
}

function saveToLocalStorage() {
  const data = {
    users: state.users,
    donations: state.donations,
    volunteerDonations: state.volunteerDonations,
    volunteerInstitutions: state.volunteerInstitutions
  };
  localStorage.setItem('ecolinkData', JSON.stringify(data));
}

// Função para navegar entre telas com suporte a hash
function showScreen(screenId, evt) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
  
  // Atualiza o hash da URL
  window.location.hash = screenId;
}

// Detecta navegação por hash ao carregar a página
window.addEventListener('DOMContentLoaded', function() {
  const hash = window.location.hash.substring(1); // Remove o #
  if (hash === 'login' || hash === 'register') {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(hash).classList.add('active');
    document.getElementById(hash + 'Tab').classList.add('active');
  } else {
    // Padrão: mostrar login
    showScreen('login');
  }
});

// Detecta mudanças no hash
window.addEventListener('hashchange', function() {
  const hash = window.location.hash.substring(1);
  if (hash === 'login' || hash === 'register') {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(hash).classList.add('active');
    document.getElementById(hash + 'Tab').classList.add('active');
  }
});

function selectUserType(type, evt) {
  state.selectedUserType = type;
  document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('selected'));
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('selected');

  document.getElementById('transportTypeSelection').style.display = 'none';
  document.getElementById('tierSelection').style.display = 'none';
  document.getElementById('registerForm').style.display = 'none';

  if (type === 'transportador') {
    document.getElementById('transportTypeSelection').style.display = 'block';
  } else {
    renderPlanCards(type);
    document.getElementById('tierSelection').style.display = 'block';
  }
}

function selectTransportType(type, evt) {
  state.selectedTransportType = type;
  document.querySelectorAll('.transport-type').forEach(c => c.classList.remove('selected'));
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('selected');
  renderPlanCards('transportador');
  document.getElementById('tierSelection').style.display = 'block';
}

function renderPlanCards(userType) {
  const container = document.getElementById('planCards');
  const plans = PLANS[userType] || [];
  
  container.innerHTML = '';
  
  plans.forEach(plan => {
    const card = document.createElement('div');
    card.className = 'tier-card';
    if (plan.id === 'ouro') card.classList.add('gold');
    if (plan.id === 'diamante') card.classList.add('diamond');
    card.onclick = (e) => selectTier(plan.id, e);
    
    let priceText = plan.isUnique 
      ? `R$ ${plan.price.toFixed(2).replace('.', ',')}` 
      : `R$ ${plan.price.toFixed(2).replace('.', ',')}/mês`;
    
    card.innerHTML = `
      <div class="tier-icon">${plan.id === 'bronze' ? '⭐' : plan.id === 'ouro' ? '🥇' : plan.id === 'diamante' ? '💎' : '🚚'}</div>
      <h3>${plan.name}</h3>
      <p>${plan.badge}</p>
      <div class="plan-price">${priceText}</div>
    `;
    
    container.appendChild(card);
  });
}

function selectTier(tier, evt) {
  state.selectedTier = tier;
  document.querySelectorAll('#tierSelection .tier-card').forEach(c => c.classList.remove('selected'));
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('selected');
  
  document.getElementById('registerForm').style.display = 'block';
  
  const userType = state.selectedUserType;
  const plans = PLANS[userType];
  const selectedPlan = plans.find(p => p.id === tier);
  
  if (!selectedPlan) return;
  
  const priceText = selectedPlan.isUnique 
    ? `R$ ${selectedPlan.price.toFixed(2).replace('.', ',')} (taxa única)` 
    : `R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}/mês`;
  
  document.getElementById('selectedPlanName').textContent = selectedPlan.name;
  document.getElementById('selectedPlanPrice').textContent = ` - ${priceText}`;
  document.getElementById('planSummary').style.display = 'flex';
  
  const paymentSection = document.getElementById('paymentSection');
  const submitBtn = document.getElementById('submitBtn');
  
  // Pagamento necessário para todos exceto taxa única de transportador
  if (!selectedPlan.isUnique) {
    paymentSection.style.display = 'block';
    submitBtn.textContent = 'Finalizar Cadastro e Pagamento';
    document.getElementById('cardNumber').required = true;
    document.getElementById('cardName').required = true;
    document.getElementById('cardExpiry').required = true;
    document.getElementById('cardCvv').required = true;
  } else {
    paymentSection.style.display = 'block'; // Mostra para o pagamento da taxa única
    submitBtn.textContent = 'Finalizar Cadastro e Pagamento';
    document.getElementById('cardNumber').required = true;
    document.getElementById('cardName').required = true;
    document.getElementById('cardExpiry').required = true;
    document.getElementById('cardCvv').required = true;
  }
  
  if (state.selectedUserType === 'transportador') {
    document.getElementById('vehicleFields').style.display = 'block';
    document.getElementById('cnhFields').style.display = 'block';
    document.getElementById('regRenavam').required = true;
    document.getElementById('regPlaca').required = true;
    document.getElementById('regModelo').required = true;
    document.getElementById('regAno').required = true;
    document.getElementById('regCor').required = true;
    document.getElementById('regCnhNumero').required = true;
    document.getElementById('regCnhCategoria').required = true;
    document.getElementById('regCnhValidade').required = true;
  } else {
    document.getElementById('vehicleFields').style.display = 'none';
    document.getElementById('cnhFields').style.display = 'none';
  }
  
  document.getElementById('registerForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function checkPasswordStrength(password) {
  const strengthEl = document.getElementById('passwordStrength');
  let strength = 0;

  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength < 2) {
    strengthEl.textContent = 'Senha fraca';
    strengthEl.className = 'password-strength strength-weak';
  } else if (strength < 4) {
    strengthEl.textContent = 'Senha média';
    strengthEl.className = 'password-strength strength-medium';
  } else {
    strengthEl.textContent = 'Senha forte';
    strengthEl.className = 'password-strength strength-strong';
  }
}

function validateRenavam(renavam) {
  const statusEl = document.getElementById('renavamStatus');
  const cleaned = renavam.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    statusEl.textContent = '✓ RENAVAM válido';
    statusEl.className = 'renavam-status renavam-ok';
  } else if (cleaned.length > 0) {
    statusEl.textContent = '✗ RENAVAM deve ter 11 dígitos';
    statusEl.className = 'renavam-status renavam-bad';
  } else {
    statusEl.textContent = '';
  }
}

function formatCardNumber(input) {
  let value = input.value.replace(/\D/g, '');
  value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
  input.value = value;
}

function formatExpiry(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  input.value = value;
}

async function buscarCep(cep) {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return;

  document.getElementById('cepLoading').style.display = 'block';

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();

    if (!data.erro) {
      document.getElementById('regLogradouro').value = data.logradouro || '';
      document.getElementById('regBairro').value = data.bairro || '';
      document.getElementById('regCidade').value = data.localidade || '';
      document.getElementById('regEstado').value = data.uf || '';
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
  } finally {
    document.getElementById('cepLoading').style.display = 'none';
  }
}

function handleRegister(e) {
  e.preventDefault();

  const password = document.getElementById('regPassword').value;
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(password)) {
    alert('A senha deve conter letras maiúsculas e minúsculas, números, caracteres especiais e no mínimo 8 dígitos.');
    return;
  }

  const address = {
    cep: document.getElementById('regCep').value,
    logradouro: document.getElementById('regLogradouro').value,
    numero: document.getElementById('regNumero').value,
    complemento: document.getElementById('regComplemento').value,
    bairro: document.getElementById('regBairro').value,
    cidade: document.getElementById('regCidade').value,
    estado: document.getElementById('regEstado').value
  };

  const fullAddress = `${address.logradouro}, ${address.numero}${address.complemento ? ', ' + address.complemento : ''}, ${address.bairro}, ${address.cidade}, ${address.estado}, ${address.cep}`;

  const userType = state.selectedUserType;
  const plans = PLANS[userType];
  const selectedPlan = plans.find(p => p.id === state.selectedTier);

  const user = {
    id: Date.now(),
    name: document.getElementById('regName').value,
    document: document.getElementById('regDoc').value,
    email: document.getElementById('regEmail').value,
    phone: document.getElementById('regPhone').value,
    address: address,
    fullAddress: fullAddress,
    username: document.getElementById('regUsername').value,
    password: password,
    type: state.selectedUserType,
    tier: state.selectedTier,
    planPrice: selectedPlan.price,
    createdAt: new Date().toISOString()
  };

  if (state.selectedUserType === 'transportador') {
    user.transportType = state.selectedTransportType;
    user.freightRate = FREIGHT_RATES[state.selectedTransportType];
    user.vehicle = {
      renavam: document.getElementById('regRenavam').value,
      placa: document.getElementById('regPlaca').value,
      modelo: document.getElementById('regModelo').value,
      ano: document.getElementById('regAno').value,
      cor: document.getElementById('regCor').value
    };
    user.cnh = {
      numero: document.getElementById('regCnhNumero').value,
      categoria: document.getElementById('regCnhCategoria').value,
      validade: document.getElementById('regCnhValidade').value
    };
  }

  user.payment = {
    cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, '').slice(-4),
    cardName: document.getElementById('cardName').value,
    cardExpiry: document.getElementById('cardExpiry').value,
    paymentDate: new Date().toISOString(),
    status: 'active'
  };

  state.users.push(user);
  saveToLocalStorage();
  
  const successMsg = selectedPlan.isUnique 
    ? `Cadastro realizado com sucesso! Taxa única de R$ ${selectedPlan.price.toFixed(2)} processada. Bem-vindo à Ecolink!`
    : `Cadastro realizado com sucesso! Plano ${selectedPlan.name} (R$ ${selectedPlan.price.toFixed(2)}/mês) ativado. Bem-vindo à Ecolink!`;
  
  alert(successMsg);
  
  document.getElementById('registerForm').reset();
  document.getElementById('tierSelection').style.display = 'none';
  document.getElementById('transportTypeSelection').style.display = 'none';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('planSummary').style.display = 'none';
  document.getElementById('paymentSection').style.display = 'none';
  document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('selected'));
  showScreen('login');
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPassword').value;

  const user = state.users.find(u => u.username === username && u.password === password);

  if (user) {
    state.currentUser = user;
    loadDashboard();
    hideAuthTabs();
    requestNotificationPermissionOnce();
  } else {
    alert('Usuário ou senha incorretos!');
  }
}

function calculateEcoImpact(weight) {
  return {
    co2: (weight * 15.3).toFixed(2),
    water: (weight * 2700).toFixed(0),
    landfill: weight
  };
}

function loadDashboard() {
  document.getElementById('userName').textContent = state.currentUser.name;
  let typeText = `${state.currentUser.type.charAt(0).toUpperCase() + state.currentUser.type.slice(1)} - Plano ${state.currentUser.tier.charAt(0).toUpperCase() + state.currentUser.tier.slice(1)}`;
  
  if (state.currentUser.transportType) {
    typeText += ` (${state.currentUser.transportType.charAt(0).toUpperCase() + state.currentUser.transportType.slice(1)})`;
  }
  
  document.getElementById('userType').textContent = typeText;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('dashboard').classList.add('active');

  document.getElementById('doadorDash').style.display = 'none';
  document.getElementById('recebedorDash').style.display = 'none';
  document.getElementById('transportadorDash').style.display = 'none';

  if (state.currentUser.type === 'doador') {
    document.getElementById('doadorDash').style.display = 'block';
    loadDoadorDashboard();
  } else if (state.currentUser.type === 'recebedor') {
    document.getElementById('recebedorDash').style.display = 'block';
    loadRecebedorDashboard();
  } else if (state.currentUser.type === 'transportador') {
    document.getElementById('transportadorDash').style.display = 'block';
    loadTransportadorDashboard();
  }
  
  renderNotifications();
}

function loadDoadorDashboard() {
  const userDonations = state.donations.filter(d => d.donorId === state.currentUser.id);
  const totalWeight = userDonations.reduce((sum, d) => sum + parseFloat(d.weight), 0);
  const ecoImpact = calculateEcoImpact(totalWeight);

  document.getElementById('co2Saved').textContent = ecoImpact.co2;
  document.getElementById('waterSaved').textContent = ecoImpact.water;
  document.getElementById('landfillAvoided').textContent = ecoImpact.landfill.toFixed(3);

  document.getElementById('totalDonations').textContent = userDonations.length;
  document.getElementById('totalWeight').textContent = totalWeight.toFixed(3);
  document.getElementById('pendingDonations').textContent = userDonations.filter(d => d.status !== 'completed').length;

  const tbody = document.querySelector('#donationsTable tbody');
  tbody.innerHTML = '';

  userDonations.forEach(donation => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="ID">#${donation.id}</td>
      <td data-label="Categoria">${donation.category}</td>
      <td data-label="Peso (kg)">${donation.weight}</td>
      <td data-label="Data">${new Date(donation.createdAt).toLocaleDateString()}</td>
      <td data-label="Status"><span class="badge badge-${donation.status}">${donation.status}</span></td>
      <td data-label="Ações"><button class="btn btn-info" onclick="viewTracking(${donation.id})">Rastrear</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function loadRecebedorDashboard() {
  const receivedDonations = state.donations.filter(d => d.receiverId === state.currentUser.id);
  const totalWeight = receivedDonations.reduce((sum, d) => sum + parseFloat(d.weight), 0);
  const ecoImpact = calculateEcoImpact(totalWeight);

  document.getElementById('co2SavedRec').textContent = ecoImpact.co2;
  document.getElementById('waterSavedRec').textContent = ecoImpact.water;
  document.getElementById('recycledMaterial').textContent = ecoImpact.landfill.toFixed(3);

  document.getElementById('totalReceived').textContent = receivedDonations.length;
  document.getElementById('receivedWeight').textContent = totalWeight.toFixed(3);
  document.getElementById('pendingReceive').textContent = receivedDonations.filter(d => !d.receiverConfirmed).length;

  const notificationsDiv = document.getElementById('receiverNotifications');
  notificationsDiv.innerHTML = '';

  const pendingDonations = state.donations.filter(d => !d.receiverId);

  if (pendingDonations.length === 0) {
    notificationsDiv.innerHTML = '<p style="text-align: center; color: #6c757d;">Nenhuma notificação no momento</p>';
  }

  pendingDonations.forEach(donation => {
    const donor = state.users.find(u => u.id === donation.donorId);
    const notif = document.createElement('div');
    notif.className = 'notification warning';
    notif.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">Nova Doação Disponível</div>
        <div class="notification-time">${new Date(donation.createdAt).toLocaleString()}</div>
      </div>
      <p><strong>Doador:</strong> ${donor.name}</p>
      <p><strong>Categoria:</strong> ${donation.category}</p>
      <p><strong>Peso:</strong> ${donation.weight} kg</p>
      <p><strong>Localização:</strong> ${donor.fullAddress}</p>
      <div class="notification-actions">
        <button class="btn btn-danger" onclick="refuseDonation(${donation.id})">Recusar</button>
        <button class="btn btn-info" onclick="acceptDonationSelf(${donation.id})">Recolher por Conta</button>
        <button class="btn btn-primary" onclick="acceptDonationEcolink(${donation.id})">Recolher pela Ecolink</button>
      </div>
    `;
    notificationsDiv.appendChild(notif);
  });

  const tbody = document.querySelector('#receiverDonationsTable tbody');
  tbody.innerHTML = '';

  receivedDonations.forEach(donation => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="ID">#${donation.id}</td>
      <td data-label="Categoria">${donation.category}</td>
      <td data-label="Peso (kg)">${donation.weight}</td>
      <td data-label="Data">${new Date(donation.createdAt).toLocaleDateString()}</td>
      <td data-label="Status"><span class="badge badge-${donation.status}">${donation.status}</span></td>
      <td data-label="Ações"><button class="btn btn-info" onclick="viewTracking(${donation.id})">Rastrear</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function loadTransportadorDashboard() {
  const deliveries = state.donations.filter(d => d.transporterId === state.currentUser.id);
  const totalWeight = deliveries.reduce((sum, d) => sum + parseFloat(d.weight), 0);
  const distance = deliveries.length * 15;
  const ecoImpact = calculateEcoImpact(totalWeight);

  document.getElementById('totalDistanceTrans').textContent = distance.toFixed(1);
  document.getElementById('co2SavedTrans').textContent = ecoImpact.co2;
  document.getElementById('materialTransported').textContent = totalWeight.toFixed(3);

  document.getElementById('totalDeliveries').textContent = deliveries.filter(d => d.transportDelivered).length;
  document.getElementById('ongoingDeliveries').textContent = deliveries.filter(d => !d.transportDelivered).length;
  document.getElementById('totalDistance').textContent = distance.toFixed(1);

  const notificationsDiv = document.getElementById('transportNotifications');
  notificationsDiv.innerHTML = '';

  const pendingTransports = state.donations.filter(d => d.needsTransport && !d.transporterId);

  if (pendingTransports.length === 0) {
    notificationsDiv.innerHTML = '<p style="text-align: center; color: #6c757d;">Nenhuma solicitação no momento</p>';
  }

  pendingTransports.forEach(donation => {
    const donor = state.users.find(u => u.id === donation.donorId);
    const receiver = state.users.find(u => u.id === donation.receiverId);
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">Solicitação de Transporte</div>
        <div class="notification-time">${new Date(donation.createdAt).toLocaleString()}</div>
      </div>
      <p><strong>Origem:</strong> ${donor.fullAddress}</p>
      <p><strong>Destino:</strong> ${receiver ? receiver.fullAddress : '-'}</p>
      <p><strong>Categoria:</strong> ${donation.category}</p>
      <p><strong>Peso:</strong> ${donation.weight} kg</p>
      <div class="notification-actions">
        <button class="btn btn-danger" onclick="refuseTransport(${donation.id})">Recusar</button>
        <button class="btn btn-primary" onclick="acceptTransport(${donation.id})">Aceitar</button>
      </div>
    `;
    notificationsDiv.appendChild(notif);
  });

  const tbody = document.querySelector('#transporterDonationsTable tbody');
  tbody.innerHTML = '';

  deliveries.forEach(donation => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="ID">#${donation.id}</td>
      <td data-label="Categoria">${donation.category}</td>
      <td data-label="Peso (kg)">${donation.weight}</td>
      <td data-label="Data">${new Date(donation.createdAt).toLocaleDateString()}</td>
      <td data-label="Status"><span class="badge badge-${donation.status}">${donation.status}</span></td>
      <td data-label="Ações"><button class="btn btn-info" onclick="viewTracking(${donation.id})">Rastrear</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function submitDonation(e) {
  e.preventDefault();

  const donation = {
    id: Date.now(),
    donorId: state.currentUser.id,
    category: document.getElementById('donationCategory').value,
    weight: document.getElementById('donationWeight').value,
    phone: document.getElementById('donationPhone').value,
    email: document.getElementById('donationEmail').value,
    notes: document.getElementById('donationNotes').value,
    address: state.currentUser.fullAddress,
    status: 'pending',
    createdAt: new Date().toISOString(),
    donorReleased: false,
    receiverConfirmed: false,
    transportPickedUp: false,
    transportDelivered: false,
    needsTransport: false
  };

  state.donations.push(donation);
  saveToLocalStorage();
  
  pushNotification({
    title: 'Doação registrada',
    message: 'Recebedores foram notificados. Acompanhe o status pelo rastreio.',
    link: `tracking:${donation.id}`
  });
  
  alert('Doação registrada com sucesso! Os recebedores foram notificados.');
  closeModal('newDonationModal');
  document.getElementById('newDonationModal').querySelector('form').reset();
  loadDoadorDashboard();
}

function refuseDonation(donationId) {
  if (confirm('Deseja realmente recusar esta doação?')) {
    loadRecebedorDashboard();
  }
}

function acceptDonationSelf(donationId) {
  const donation = state.donations.find(d => d.id === donationId);
  donation.receiverId = state.currentUser.id;
  donation.status = 'accepted';
  donation.needsTransport = false;
  saveToLocalStorage();
  alert('Doação aceita! Você é responsável pelo recolhimento.');
  loadRecebedorDashboard();
}

function acceptDonationEcolink(donationId) {
  const donation = state.donations.find(d => d.id === donationId);
  donation.receiverId = state.currentUser.id;
  donation.status = 'accepted';
  donation.needsTransport = true;
  saveToLocalStorage();
  
  pushNotification({
    title: 'Coleta solicitada',
    message: 'Aguardando transportador aceitar a entrega.',
    link: `tracking:${donationId}`
  });
  
  alert('Doação aceita! Transportadores foram notificados para realizar o recolhimento.');
  loadRecebedorDashboard();
}

function refuseTransport(donationId) {
  if (confirm('Deseja realmente recusar este transporte?')) {
    loadTransportadorDashboard();
  }
}

function acceptTransport(donationId) {
  const donation = state.donations.find(d => d.id === donationId);
  donation.transporterId = state.currentUser.id;
  donation.status = 'in_transit';

  const donor = state.users.find(u => u.id === donation.donorId);
  const receiver = state.users.find(u => u.id === donation.receiverId);

  saveToLocalStorage();
  
  pushNotification({
    title: 'Transporte aceito',
    message: 'Você está designado para esta entrega. Consulte o rastreio.',
    link: `tracking:${donationId}`
  });
  
  alert(`Transporte aceito!\n\nDoador: ${donor.name}\nRecebedor: ${receiver.name}\nTransportador: ${state.currentUser.name}`);
  loadTransportadorDashboard();
}

function viewTracking(donationId) {
  const donation = state.donations.find(d => d.id === donationId);
  const donor = state.users.find(u => u.id === donation.donorId);
  const receiver = donation.receiverId ? state.users.find(u => u.id === donation.receiverId) : null;
  const transporter = donation.transporterId ? state.users.find(u => u.id === donation.transporterId) : null;

  const allConfirmed =
    donation.donorReleased &&
    (donation.needsTransport ? donation.transportPickedUp && donation.transportDelivered : true) &&
    donation.receiverConfirmed;

  const trackingDiv = document.getElementById('trackingContent');
  trackingDiv.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h3 style="color: var(--primary-green);">Doação #${donation.id}</h3>
      <p><strong>Categoria:</strong> ${donation.category}</p>
      <p><strong>Peso:</strong> ${donation.weight} kg</p>
      <p><strong>Status:</strong> <span class="badge badge-${donation.status}">${allConfirmed ? 'Concluído' : donation.status}</span></p>
    </div>

    <div class="timeline">
      <div class="timeline-item ${donation.createdAt ? 'completed' : 'pending'}">
        <h4>Doação Registrada</h4>
        <p>${new Date(donation.createdAt).toLocaleString()}</p>
        <p>Doador: ${donor.name}</p>
      </div>

      <div class="timeline-item ${donation.receiverId ? 'completed' : 'pending'}">
        <h4>Aceita pelo Recebedor</h4>
        ${receiver ? `<p>Recebedor: ${receiver.name}</p>` : '<p>Aguardando aceitação...</p>'}
      </div>

      ${donation.needsTransport ? `
        <div class="timeline-item ${donation.transporterId ? 'completed' : 'pending'}">
          <h4>Transportador Designado</h4>
          ${transporter ? `<p>Transportador: ${transporter.name}</p>${transporter.transportType ? `<p>Veículo: ${transporter.transportType}</p>` : ''}` : '<p>Aguardando transportador...</p>'}
        </div>
      ` : ''}

      <div class="timeline-item ${donation.donorReleased ? 'completed' : 'pending'}">
        <h4>Liberado pelo Doador</h4>
        ${donation.donorReleased ? '<p>✓ Confirmado</p>' : '<p>Aguardando liberação...</p>'}
        ${state.currentUser.type === 'doador' && donation.donorId === state.currentUser.id && !donation.donorReleased && donation.receiverId ?
          `<button class="btn btn-primary" onclick="confirmRelease(${donation.id})">Confirmar Liberação</button>` : ''}
      </div>

      ${donation.needsTransport ? `
        <div class="timeline-item ${donation.transportPickedUp ? 'completed' : 'pending'}">
          <h4>Retirado pelo Transportador</h4>
          ${donation.transportPickedUp ? '<p>✓ Confirmado</p>' : '<p>Aguardando retirada...</p>'}
          ${state.currentUser.type === 'transportador' && donation.transporterId === state.currentUser.id && !donation.transportPickedUp && donation.donorReleased ?
            `<button class="btn btn-primary" onclick="confirmPickup(${donation.id})">Confirmar Retirada</button>` : ''}
        </div>

        <div class="timeline-item ${donation.transportDelivered ? 'completed' : 'pending'}">
          <h4>Entregue pelo Transportador</h4>
          ${donation.transportDelivered ? '<p>✓ Confirmado</p>' : '<p>Aguardando entrega...</p>'}
          ${state.currentUser.type === 'transportador' && donation.transporterId === state.currentUser.id && !donation.transportDelivered && donation.transportPickedUp ?
            `<button class="btn btn-primary" onclick="confirmDelivery(${donation.id})">Confirmar Entrega</button>` : ''}
        </div>
      ` : ''}

      <div class="timeline-item ${donation.receiverConfirmed ? 'completed' : 'pending'}">
        <h4>Recebido e Confirmado</h4>
        ${donation.receiverConfirmed ? '<p>✓ Processo Concluído</p>' : '<p>Aguardando confirmação final...</p>'}
        ${state.currentUser.type === 'recebedor' && donation.receiverId === state.currentUser.id && !donation.receiverConfirmed && (donation.transportDelivered || (!donation.needsTransport && donation.donorReleased)) ?
          `<button class="btn btn-primary" onclick="confirmReceipt(${donation.id})">Confirmar Recebimento</button>` : ''}
      </div>
    </div>
  `;

  openModal('trackingModal');
}

function confirmRelease(donationId) {
  const donation = state.donations.find(d => d.id === donationId);
  donation.donorReleased = true;
  saveToLocalStorage();
  alert('Liberação confirmada!');
  closeModal('trackingModal');
  loadDoadorDashboard();
}

function confirmPickup(donationId) {
  const donation = state.donations.find(d => d.id === donationId);
  donation.transportPickedUp = true;
  saveToLocalStorage();
  alert('Retirada confirmada!');
  closeModal('trackingModal');
  loadTransportadorDashboard();
}

function confirmDelivery(donationId) {
  const donation = state.donations.find(d => d.id === donationId);
  donation.transportDelivered = true;
  saveToLocalStorage();
  alert('Entrega confirmada!');
  closeModal('trackingModal');
  loadTransportadorDashboard();
}

function confirmReceipt(donationId) {
  const donation = state.donations.find(d => d.id === donationId);
  donation.receiverConfirmed = true;
  donation.status = 'completed';
  saveToLocalStorage();
  alert('Recebimento confirmado! Processo concluído com sucesso.');
  closeModal('trackingModal');
  loadRecebedorDashboard();
}

function pushNotification({ title, message, link = null }) {
  bell.list.unshift({
    id: Date.now(),
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false,
    link
  });
  bell.unread++;
  renderNotifications();
  showToast(`${title}: ${message}`);

  if (window.Notification && Notification.permission === 'granted') {
    try {
      new Notification(title, { body: message });
    } catch (e) {}
  }
}

function requestNotificationPermissionOnce() {
  if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

function renderNotifications() {
  const countEl = document.getElementById('notifCount');
  const listEl = document.getElementById('notifList');
  if (!countEl || !listEl) return;

  if (bell.unread > 0) {
    countEl.textContent = bell.unread > 99 ? '99+' : String(bell.unread);
    countEl.hidden = false;
  } else {
    countEl.hidden = true;
  }

  listEl.innerHTML = '';
  if (bell.list.length === 0) {
    listEl.innerHTML = '<li><span class="notif-time">Sem notificações</span></li>';
    return;
  }

  bell.list.forEach(n => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <div class="notif-title">${n.title}</div>
        <div>${n.message}</div>
        <div class="notif-time">${new Date(n.createdAt).toLocaleString()}</div>
      </div>
      <div class="notif-actions">
        ${n.link ? `<button class="btn btn-info" onclick="openFromNotification('${n.link}', ${n.id})">Ver</button>` : ''}
        <button class="btn btn-warning" onclick="markAsRead(${n.id})">Lido</button>
      </div>
    `;
    listEl.appendChild(li);
  });
}

function markAsRead(id) {
  const item = bell.list.find(n => n.id === id);
  if (item && !item.read) {
    item.read = true;
    bell.unread = Math.max(0, bell.unread - 1);
    renderNotifications();
  }
}

function clearAllNotifications() {
  bell.list.forEach(n => n.read = true);
  bell.unread = 0;
  renderNotifications();
}

function toggleNotifications() {
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;
  dd.hidden = !dd.hidden;
}

function openFromNotification(link, id) {
  markAsRead(id);
  toggleNotifications();
  if (link.startsWith('tracking:')) {
    const donationId = Number(link.split(':')[1]);
    viewTracking(donationId);
  }
}

function showToast(text) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.hidden = false;
  setTimeout(() => {
    toast.hidden = true;
  }, 3500);
}

function hideAuthTabs() {
  const tabs = document.getElementById('authTabs');
  const donaBtn = document.querySelector('.volunteer-btn');
  if (tabs) tabs.classList.add('hidden');
  if (donaBtn) donaBtn.classList.add('hidden');
}

function showAuthTabs() {
  const tabs = document.getElementById('authTabs');
  const donaBtn = document.querySelector('.volunteer-btn');
  if (tabs) tabs.classList.remove('hidden');
  if (donaBtn) donaBtn.classList.remove('hidden');
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function logout() {
  if (confirm('Deseja realmente sair?')) {
    state.currentUser = null;
    document.getElementById('loginForm').reset();
    showAuthTabs();
    bell.list = [];
    bell.unread = 0;
    renderNotifications();
    showScreen('login');
  }
}

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
};

document.addEventListener('click', (e) => {
  const dd = document.getElementById('notifDropdown');
  const btn = document.getElementById('notifBtn');
  if (!dd || !btn) return;
  if (!dd.hidden && !dd.contains(e.target) && !btn.contains(e.target)) {
    dd.hidden = true;
  }
});

loadFromLocalStorage();

const demoUsers = [
  {
    id: 1,
    name: 'Confecções TextilMax Ltda',
    document: '12.345.678/0001-90',
    email: 'contato@textilmax.com.br',
    phone: '(47) 3333-4444',
    address: {
      cep: '89030-000',
      logradouro: 'Rua das Indústrias',
      numero: '1500',
      complemento: 'Galpão 3',
      bairro: 'Itoupava Seca',
      cidade: 'Blumenau',
      estado: 'SC'
    },
    fullAddress: 'Rua das Indústrias, 1500, Galpão 3, Itoupava Seca, Blumenau, SC, 89030-000',
    username: 'doador1',
    password: 'Senha@123',
    type: 'doador',
    tier: 'ouro',
    planPrice: 99.90,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'EcoRecicla Têxtil S.A.',
    document: '98.765.432/0001-10',
    email: 'comercial@ecorecicla.com.br',
    phone: '(47) 3555-6666',
    address: {
      cep: '89010-100',
      logradouro: 'Avenida Beira Rio',
      numero: '800',
      complemento: '',
      bairro: 'Centro',
      cidade: 'Blumenau',
      estado: 'SC'
    },
    fullAddress: 'Avenida Beira Rio, 800, Centro, Blumenau, SC, 89010-100',
    username: 'recebedor1',
    password: 'Senha@456',
    type: 'recebedor',
    tier: 'diamante',
    planPrice: 179.90,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'TransLog Cargas Especiais',
    document: '55.444.333/0001-22',
    email: 'operacoes@translog.com.br',
    phone: '(47) 3777-8888',
    address: {
      cep: '89035-500',
      logradouro: 'Rodovia BR-101',
      numero: 'Km 25',
      complemento: '',
      bairro: 'Distrito Industrial',
      cidade: 'Blumenau',
      estado: 'SC'
    },
    fullAddress: 'Rodovia BR-101, Km 25, Distrito Industrial, Blumenau, SC, 89035-500',
    username: 'transportador1',
    password: 'Senha@789',
    type: 'transportador',
    tier: 'transportador',
    transportType: 'caminhao',
    freightRate: 12.90,
    planPrice: 9.90,
    vehicle: {
      renavam: '12345678901',
      placa: 'ABC1234',
      modelo: 'Mercedes-Benz Accelo',
      ano: '2022',
      cor: 'Branco'
    },
    cnh: {
      numero: '12345678901',
      categoria: 'C',
      validade: '2027-12-31'
    },
    createdAt: new Date().toISOString()
  }
];

if (state.users.length === 0) {
  state.users = [...demoUsers];
  saveToLocalStorage();
}

console.log('Sistema Ecolink inicializado!');
console.log('Usuários demo disponíveis:');
console.log('Doador - usuário: doador1 | senha: Senha@123');
console.log('Recebedor - usuário: recebedor1 | senha: Senha@456');
console.log('Transportador - usuário: transportador1 | senha: Senha@789');